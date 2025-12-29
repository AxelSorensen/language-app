import { useState } from "#app";
import { ref, computed } from "vue";
import { LanguageService } from "~/services/LanguageService";
import { generateRandomId } from "~/utils/misc";

export interface Word {
  id: string;
  text: string;
  correction?: string | null;
  translation?: string | null;
  status: "empty" | "pending" | "checked" | "error" | "idle";
  sentenceError?: { correction: string; explanation: string } | null;
}

export const useWords = () => {
  const words = useState<Word[]>("words", () => []);

  if (words.value.length === 0) {
    words.value.push({
      text: "",
      id: generateRandomId(),
      correction: null,
      translation: null,
      status: "idle",
      sentenceError: null,
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
        console.log("Sentence correction:", result);
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

    console.log("Processing word:", word.text, "status before:", word.status);
    updateWord((w) => ({ ...w, status: "pending" }));
    console.log("Status set to pending for word:", word.text);

    try {
      // Call spell-check and translation separately
      const [spellResult, translateResult] = await Promise.all([
        LanguageService.spellCheck(word.text, fullText, controller.signal),
        LanguageService.wordTranslate(word.text, fullText, controller.signal),
      ]);

      // Remove controller if successful
      abortControllers.value.delete(id);

      updateWord((w) => ({
        ...w,
        correction:
          spellResult.type === "correction" ? spellResult.correction : null,
        translation:
          spellResult.type === "unknown_word"
            ? "unknown"
            : translateResult.translation,
        status: "checked",
      }));
      console.log("Status set to checked for word:", word.text);
    } catch (error) {
      // Remove controller on error
      abortControllers.value.delete(id);
      if (error.name === "AbortError") {
        console.log("Word processing cancelled for:", word.text);
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
