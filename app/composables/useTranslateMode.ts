import { ref, nextTick } from "vue";
import type { Ref } from "vue";
import { LanguageService } from "~/services/LanguageService";
import { generateRandomId } from "~/utils/misc";
import type { Word } from "~/types";

export interface TranslateModeComposable {
  state: Ref<{
    translateMode: boolean;
    wordsToTranslate: string;
    isTranslating: boolean;
  }>;
  actions: {
    toggleTranslateMode: (modularInputRef: any) => Promise<void>;
    translateAndInsert: (
      idx: number,
      words: Ref<Word[]>,
      processWord: (id: string, fullText: string) => void,
      languages: { source: string; target: string },
      translateStartedOnEmpty: boolean
    ) => Promise<string | undefined>;
  };
}

export function useTranslateMode(): TranslateModeComposable {
  const state = useState<{
    translateMode: boolean;
    wordsToTranslate: string;
    isTranslating: boolean;
  }>("translate-mode-state", () => ({
    translateMode: false,
    wordsToTranslate: "",
    isTranslating: false,
  }));

  async function toggleTranslateMode(modularInputRef: any) {
    state.value.translateMode = !state.value.translateMode;
    if (state.value.translateMode) {
      state.value.wordsToTranslate = ""; // Clear the input when entering translate mode
      await nextTick();
      modularInputRef.value.focusTranslateInput();
    }
  }

  async function translateAndInsert(
    idx: number,
    words: Ref<Word[]>,
    processWord: (id: string, fullText: string) => void,
    languages: { source: string; target: string },
    translateStartedOnEmpty: boolean
  ) {
    if (!state.value.wordsToTranslate) {
      return;
    }

    state.value.isTranslating = true;

    // Filter out empty words from the text to translate
    const filteredText = state.value.wordsToTranslate
      .split(" ")
      .filter((word) => word.trim() !== "")
      .join(" ");

    const response = await $fetch("/api/translate", {
      method: "POST",
      body: {
        text: filteredText,
        context: words.value.map((w) => w.text).join(" "),
        source: languages.source,
        target: languages.target,
      },
    });
    state.value.isTranslating = false;

    // Exit translate mode immediately after successful translation
    state.value.translateMode = false;

    const translatedText = response.translation;
    const newWords = translatedText
      .split(" ")
      .filter((word) => word.trim() !== "");
    if (newWords.length > 0) {
      let insertIdx = translateStartedOnEmpty ? idx : idx + 1;
      if (translateStartedOnEmpty) {
        // Replace the empty word
        words.value.splice(
          insertIdx,
          1,
          ...newWords.map((word) => ({
            id: generateRandomId(),
            text: word,
            status: "idle",
            correction: null,
            translation: null,
          }))
        );
      } else {
        // Insert after the word with text
        words.value.splice(
          insertIdx,
          0,
          ...newWords.map((word) => ({
            id: generateRandomId(),
            text: word,
            status: "idle",
            correction: null,
            translation: null,
          }))
        );
      }

      // Process the new translated words
      const fullText = words.value.map((w) => w.text).join(" ");
      for (let i = insertIdx; i < insertIdx + newWords.length; i++) {
        processWord(words.value[i].id, fullText);
      }

      // Return the last word id for focus
      return words.value[insertIdx + newWords.length - 1].id;
    }

    // After translating, exit translate mode
    // state.value.translateMode = false; // Already done above

    // Clear the translate input
    state.value.wordsToTranslate = "";

    // Reset the flag is handled in index
  }

  return {
    state,
    actions: {
      toggleTranslateMode,
      translateAndInsert,
    },
  };
}
