import { useState } from "#app";
import { ref, computed, readonly } from "vue";

export interface DictionaryEntry {
  word: string;
  translation: string;
  addedAt: Date;
  language: string;
}

export const useDictionary = () => {
  const dictionary = useState<DictionaryEntry[]>("dictionary", () => {
    // Load from localStorage if available
    if (process.client) {
      const stored = localStorage.getItem("language-app-dictionary");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Convert date strings back to Date objects
          return parsed.map((entry: any) => ({
            ...entry,
            addedAt: new Date(entry.addedAt),
          }));
        } catch (e) {
          console.error("Failed to parse dictionary from localStorage:", e);
        }
      }
    }
    return [];
  });

  // Save to localStorage whenever dictionary changes
  const saveToStorage = () => {
    if (process.client) {
      localStorage.setItem(
        "language-app-dictionary",
        JSON.stringify(dictionary.value)
      );
    }
  };

  const addWord = (word: string, translation: string, language: string) => {
    // Check if word already exists
    const exists = dictionary.value.some(
      (entry) =>
        entry.word.toLowerCase() === word.toLowerCase() &&
        entry.language === language
    );

    if (!exists) {
      dictionary.value.push({
        word,
        translation,
        addedAt: new Date(),
        language,
      });
      saveToStorage();
      console.log(`Added "${word}" to dictionary`);
    }
  };

  const removeWord = (word: string, language: string) => {
    const index = dictionary.value.findIndex(
      (entry) =>
        entry.word.toLowerCase() === word.toLowerCase() &&
        entry.language === language
    );
    if (index !== -1) {
      dictionary.value.splice(index, 1);
      saveToStorage();
    }
  };

  const hasWord = (word: string, language: string) => {
    return dictionary.value.some(
      (entry) =>
        entry.word.toLowerCase() === word.toLowerCase() &&
        entry.language === language
    );
  };

  const getWordsForLanguage = (language: string) => {
    return dictionary.value.filter((entry) => entry.language === language);
  };

  const clearDictionary = () => {
    dictionary.value = [];
    if (process.client) {
      localStorage.removeItem("language-app-dictionary");
    }
  };

  const totalWords = computed(() => dictionary.value.length);

  return {
    dictionary: readonly(dictionary),
    addWord,
    removeWord,
    hasWord,
    getWordsForLanguage,
    clearDictionary,
    totalWords,
  };
};
