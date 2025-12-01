import { useState } from "#app";
import { LanguageService } from "~/services/LanguageService";

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

  const processWord = async (id: string, fullText: string) => {
    const word = words.value.find((w) => w.id === id);
    if (!word) return;

    if (!fullText.trim()) {
      words.value = [];
      return;
    }

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
        LanguageService.spellCheck(word.text, fullText),
        LanguageService.wordTranslate(word.text, fullText),
      ]);

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
      console.error("Error processing word:", error);
      updateWord((w) => ({ ...w, status: "error" }));
    }
  };

  return {
    words,
    processWord,
  };
};
