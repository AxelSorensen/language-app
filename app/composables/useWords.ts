import { useState, useCookie } from "#app";
import { ref, computed } from "vue";
import { LanguageService } from "~/services/LanguageService";
import { generateRandomId } from "~/utils/misc";
import { useDictionary } from "~/composables/useDictionary";
import { useSettings } from "~/composables/useSettings";
import type { Word } from "~/types";

export const useWords = (id?: string) => {
  const key = id ? `words-${id}` : "words";
  const words = useState<Word[]>(key, () => []);

  const { targetLanguage } = useSettings();

  if (words.value.length === 0) {
    words.value.push({
      text: "",
      id: generateRandomId(),
      correction: null,
      translation: null,
      status: "idle",
      sentenceError: null,
      newlyAdded: false,
    });
  }

  const hasText = computed(() => words.value.some((w) => w.text.trim() !== ""));

  const abortControllers = ref<Map<string, AbortController>>(new Map());

  const cancelWordProcessing = (id: string) => {
    const controller = abortControllers.value.get(id);
    if (controller) {
      controller.abort();
      abortControllers.value.delete(id);
    }
  };

  const clearWords = () => {
    words.value = [
      {
        text: "",
        id: generateRandomId(),
        correction: null,
        translation: null,
        status: "idle",
        sentenceError: null,
        newlyAdded: false,
      },
    ];
  };

  const isCheckingSentence = ref(false);

  const checkSentence = async () => {
    isCheckingSentence.value = true;
    const fullText = words.value.map((w) => w.text).join(" ");
    if (fullText.trim()) {
      try {
        const result = await $fetch("/api/check-sentence", {
          method: "POST",
          body: { sentence: fullText },
        });
        // Clear previous sentence errors
        words.value.forEach((w) => (w.sentenceError = null));
        if (result.type === "correction") {
          const startIdx = fullText.indexOf(result.wrong_text);
          if (startIdx !== -1) {
            const endIdx = startIdx + result.wrong_text.length;
            let currentIdx = 0;
            for (let i = 0; i < words.value.length; i++) {
              const wordStart = currentIdx;
              const wordEnd = currentIdx + words.value[i].text.length;
              if (wordEnd > startIdx && wordStart < endIdx) {
                words.value[i].sentenceError = {
                  correction: result.correction,
                  explanation: result.explanation,
                };
              }
              currentIdx += words.value[i].text.length + 1; // +1 for space
            }
          }
        }
      } catch (error) {
        console.error("Sentence check failed:", error);
      }
    }
    isCheckingSentence.value = false;
  };

  const processWord = async (id: string, fullText: string) => {
    const word = words.value.find((w) => w.id === id);
    if (!word) return;

    // Skip processing if already checked (e.g., suggested words)
    if (word.status === "checked") return;

    // Clean the word by removing commas and dots, and make lowercase
    const cleanedWordText = word.text.toLowerCase().replace(/[,.]/g, "").trim();

    if (!fullText.trim() && words.value.length > 1) {
      words.value = [];
      return;
    }

    // Cancel any existing processing for this word
    // cancelWordProcessing(id);

    const controller = new AbortController();
    abortControllers.value.set(id, controller);

    const updateWord = (updater: (w: Word) => Word) => {
      const index = words.value.findIndex((w) => w.id === id);
      if (index !== -1) {
        const currentWord = words.value[index];
        if (currentWord) {
          words.value[index] = updater(currentWord);
        }
      }
    };

    updateWord((w) => ({ ...w, status: "pending" }));

    try {
      // Call spell-check and translation separately
      const [spellResult, translateResult] = await Promise.all([
        LanguageService.spellCheck(
          cleanedWordText,
          fullText,
          controller.signal
        ),
        LanguageService.wordTranslate(
          cleanedWordText,
          fullText,
          controller.signal
        ),
      ]);

      // Remove controller if successful
      abortControllers.value.delete(id);

      // Add to dictionary if word is valid and has translation
      let wasAddedToDictionary = false;
      if (
        spellResult.type === "valid" &&
        translateResult.translation !== "unknown"
      ) {
        const { addWord } = useDictionary();
        wasAddedToDictionary = addWord(
          cleanedWordText,
          translateResult.translation,
          targetLanguage.value.id
        );
      }

      updateWord((w) => ({
        ...w,
        correction:
          spellResult.type === "correction" ? spellResult.correction : null,
        translation:
          spellResult.type === "unknown_word"
            ? "unknown"
            : translateResult.translation,
        status: "checked",
        newlyAdded: wasAddedToDictionary ? true : w.newlyAdded,
        firstUsed: wasAddedToDictionary
          ? new Date().toISOString()
          : w.firstUsed,
      }));

      // If newly added, clear all other newlyAdded flags and remove this one after 1 second
      if (wasAddedToDictionary) {
        // Clear all other newlyAdded flags
        words.value.forEach((word, index) => {
          if (word.id !== id && word.newlyAdded) {
            words.value[index] = { ...word, newlyAdded: false };
          }
        });

        setTimeout(() => {
          updateWord((w) => ({ ...w, newlyAdded: false }));
        }, 1000);
      }
    } catch (error) {
      // Remove controller on error
      abortControllers.value.delete(id);
      if ((error as Error).name === "AbortError") {
        // Reset status to idle if cancelled
        updateWord((w) => ({ ...w, status: "idle" }));
        return;
      }
      console.error("Error processing word:", error);
      updateWord((w) => ({ ...w, status: "error" }));
    }
  };

  return {
    words,
    processWord,
    cancelWordProcessing,
    hasText,
    clearWords,
    isCheckingSentence,
    checkSentence,
  };
};
