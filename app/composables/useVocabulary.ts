import { useState } from "#app";
import { ref, computed, readonly } from "vue";

export interface VocabularyEntry {
  word: string;
  translation: string;
  addedAt: Date;
  language: string;
  usageCount: number;
}

export const useVocabulary = () => {
  const vocabulary = useState<VocabularyEntry[]>("vocabulary", () => []);
  const newlyAddedWords = useState<Set<string>>(
    "newlyAddedWords",
    () => new Set()
  );
  const newWordsCount = useState<number>("newWordsCount", () => 0);
  const favoritedWords = useState<Set<string>>(
    "favoritedWords",
    () => new Set()
  );

  // Ensure all entries have usageCount for backward compatibility
  vocabulary.value.forEach((entry) => {
    if (typeof entry.usageCount !== "number") {
      entry.usageCount = 1;
    }
  });

  const addWord = (word: string, translation: string, language: string) => {
    // Clean the word by removing commas and dots, and make lowercase
    const cleanedWord = word.replace(/[,.]/g, "").trim().toLowerCase();

    // Check if cleaned word already exists
    const existingIndex = vocabulary.value.findIndex((entry) => {
      const entryLang =
        typeof entry.language === "string" ? entry.language : entry.language.id;
      return entry.word === cleanedWord && entryLang === language;
    });

    if (existingIndex !== -1) {
      // Ensure usageCount exists (for backward compatibility)
      if (typeof vocabulary.value[existingIndex].usageCount !== "number") {
        vocabulary.value[existingIndex].usageCount = 1;
      }
      // Increment usage count
      vocabulary.value[existingIndex].usageCount += 1;
      return false; // Word already existed
    } else if (cleanedWord) {
      vocabulary.value.push({
        word: cleanedWord,
        translation,
        addedAt: new Date(),
        language,
        usageCount: 1,
      });
      // Mark as newly added for flashing effect
      const key = `${cleanedWord}`;
      newlyAddedWords.value.add(key);
      // Remove from newly added after 2 seconds
      // Increment new words count
      newWordsCount.value++;
      return true; // Word was newly added
    }
    return false; // Empty word, not added
  };

  const removeWord = (word: string, language: string) => {
    const index = vocabulary.value.findIndex((entry) => {
      const entryLang =
        typeof entry.language === "string" ? entry.language : entry.language.id;
      return entry.word === word.toLowerCase() && entryLang === language;
    });
    if (index !== -1) {
      vocabulary.value.splice(index, 1);
    }
  };

  const hasWord = (word: string, language: string) => {
    return vocabulary.value.some((entry) => {
      const entryLang =
        typeof entry.language === "string" ? entry.language : entry.language.id;
      return entry.word === word.toLowerCase() && entryLang === language;
    });
  };

  const getWordsForLanguage = (language: string) => {
    return vocabulary.value.filter((entry) => {
      const entryLang =
        typeof entry.language === "string" ? entry.language : entry.language.id;
      return entryLang === language;
    });
  };

  const clearNewWordsCount = () => {
    newWordsCount.value = 0;
  };

  const clearNewlyAddedWords = () => {
    newlyAddedWords.value.clear();
  };

  const toggleFavorite = (word: string) => {
    const key = word.toLowerCase();
    if (favoritedWords.value.has(key)) {
      favoritedWords.value.delete(key);
    } else {
      favoritedWords.value.add(key);
    }
  };

  const isFavorited = (word: string) => {
    return favoritedWords.value.has(word.toLowerCase());
  };

  const clearVocabulary = () => {
    vocabulary.value = [];
  };

  const totalWords = computed(() => vocabulary.value.length);

  return {
    dictionary: readonly(vocabulary),
    newlyAddedWords: readonly(newlyAddedWords),
    newWordsCount: readonly(newWordsCount),
    favoritedWords: readonly(favoritedWords),
    addWord,
    removeWord,
    hasWord,
    getWordsForLanguage,
    clearDictionary: clearVocabulary,
    clearNewWordsCount,
    clearNewlyAddedWords,
    toggleFavorite,
    isFavorited,
    totalWords,
  };
};
