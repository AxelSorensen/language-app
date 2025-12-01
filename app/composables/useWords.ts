import { useState } from "#app";
import { LanguageService } from "~/services/LanguageService";

export interface Word {
  id: string;
  text: string;
  correction?: string | null;
  translation?: string | null;
  status: "empty" | "pending" | "checked" | "error" | "idle";
}

export const useWords = () => {
  const words = useState<Word[]>("words", () => []);

  const processWord = async (id: string, fullText: string) => {
    const word = words.value.find((w) => w.id === id);
    if (!word) return;

    const updateWord = (updater: (w: Word) => Word) => {
      const index = words.value.findIndex((w) => w.id === id);
      if (index !== -1) {
        words.value[index] = updater(words.value[index]);
      }
    };

    console.log("Processing word:", word.text, "status before:", word.status);
    updateWord((w) => ({ ...w, status: "pending" }));
    console.log("Status set to pending for word:", word.text);

    try {
      const result = await LanguageService.spellCheck(word.text, fullText);
      updateWord((w) => ({
        ...w,
        correction: result.correction,
        translation: result.translation,
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
