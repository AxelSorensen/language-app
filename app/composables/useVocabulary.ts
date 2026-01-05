import { useState } from "#app";
import { ref, computed, readonly, watch } from "vue";
import { FirestoreRepository } from "../repositories/FirestoreRepository";
import { useSettings } from "./useSettings";

export interface VocabularyEntry {
  word: string;
  translation: string;
  addedAt: Date;
  language: string;
  usageCount: number;
}

export interface VocabularyDocument {
  [word: string]: {
    translation: string;
    addedAt: string; // ISO string
    language: string;
    usageCount: number;
  };
}

export const useVocabulary = () => {
  const { targetLanguage } = useSettings();

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
  const modifiedEntries = useState<Set<string>>(
    "modifiedEntries",
    () => new Set()
  );
  const deletedEntries = useState<Set<string>>(
    "deletedEntries",
    () => new Set()
  );

  // Firestore repository for vocabulary collection
  const firebaseRepo = new FirestoreRepository<VocabularyDocument>(
    "vocabulary"
  );

  // Ensure all entries have usageCount for backward compatibility
  vocabulary.value.forEach((entry) => {
    if (typeof entry.usageCount !== "number") {
      entry.usageCount = 1;
    }
  });

  const addWord = (
    word: string,
    translation: string,
    language: string,
    addedAt?: Date
  ) => {
    // Clean the word by removing commas and dots, and make lowercase
    const cleanedWord = word.replace(/[,.]/g, "").trim().toLowerCase();

    // Check if cleaned word already exists
    const existingIndex = vocabulary.value.findIndex((entry) => {
      return entry.word === cleanedWord && entry.language === language;
    });

    if (existingIndex !== -1) {
      const existingEntry = vocabulary.value[existingIndex];
      if (existingEntry) {
        // Ensure usageCount exists (for backward compatibility)
        if (typeof existingEntry.usageCount !== "number") {
          existingEntry.usageCount = 1;
        }
        // Increment usage count
        existingEntry.usageCount += 1;
        // Mark as modified
        modifiedEntries.value.add(existingEntry.word);
      }
      return false; // Word already existed
    } else if (cleanedWord) {
      vocabulary.value.push({
        word: cleanedWord,
        translation,
        addedAt: addedAt || new Date(),
        language,
        usageCount: 1,
      });
      // Mark as modified (new entry)
      modifiedEntries.value.add(cleanedWord);
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

  const deleteWord = (word: string, language: string) => {
    const index = vocabulary.value.findIndex((entry) => {
      return entry.word === word.toLowerCase() && entry.language === language;
    });
    if (index !== -1) {
      const deletedEntry = vocabulary.value[index];
      if (deletedEntry) {
        vocabulary.value.splice(index, 1);
        // Track the deletion for Firestore sync
        deletedEntries.value.add(deletedEntry.word);
        // Remove from modified if it was there
        modifiedEntries.value.delete(deletedEntry.word);
      }
    }
  };

  const hasWord = (word: string, language: string) => {
    return vocabulary.value.some((entry) => {
      return entry.word === word && entry.language === language;
    });
  };

  const getWordsForLanguage = (language: string) => {
    return vocabulary.value.filter((entry) => {
      return entry.language === language;
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
    if (!word) return false;
    return favoritedWords.value.has(word.toLowerCase());
  };

  const clearVocabulary = () => {
    vocabulary.value = [];
  };

  const totalWords = computed(() => vocabulary.value.length);

  // Load vocabulary from Firestore
  const loadVocabularyFromFirestore = async () => {
    try {
      const loadedVocabulary: VocabularyEntry[] = [];

      // Load all vocabulary chunks
      let chunkIndex = 1;
      while (true) {
        const docId =
          chunkIndex === 1
            ? "user-vocabulary"
            : `user-vocabulary-${chunkIndex}`;
        const doc = await firebaseRepo.getById(docId);

        if (!doc) break; // No more chunks

        // Convert the map back to array format (words are now keys)
        Object.entries(doc).forEach(([word, entry]: [string, any]) => {
          // Skip metadata fields and filter by target language
          if (
            word !== "id" &&
            entry.translation &&
            entry.addedAt &&
            entry.language
          ) {
            loadedVocabulary.push({
              word: word,
              translation: entry.translation,
              addedAt: new Date(entry.addedAt),
              language: entry.language,
              usageCount: entry.usageCount || 1,
            });
          }
        });

        chunkIndex++;
      }

      // Merge with existing vocabulary (prefer local state if it exists)
      if (vocabulary.value.length === 0) {
        vocabulary.value = loadedVocabulary;
      }

      // Clear modified entries since we just loaded fresh data
      modifiedEntries.value.clear();
      deletedEntries.value.clear();

      console.log("Vocabulary loaded from Firestore");
    } catch (error) {
      console.error("Error loading vocabulary from Firestore:", error);
    }
  };

  // Clean up extra chunks that are no longer needed
  const cleanupExtraChunks = async (usedChunks: number) => {
    try {
      let chunkIndex = usedChunks + 1;
      while (true) {
        const docId = `user-vocabulary-${chunkIndex}`;
        const doc = await firebaseRepo.getById(docId);

        if (!doc) break; // No more chunks to clean

        // Delete empty chunks
        await firebaseRepo.delete(docId);
        chunkIndex++;
      }
    } catch (error) {
      console.error("Error cleaning up extra chunks:", error);
    }
  };

  // Save vocabulary in chunks if document exceeds size limit
  const saveVocabularyInChunks = async (vocabularyDoc: VocabularyDocument) => {
    const entries = Object.entries(vocabularyDoc);
    const chunks: VocabularyDocument[] = [];
    let currentChunk: VocabularyDocument = {};
    let currentSize = 0;
    const maxChunkSize = 800 * 1024; // 800KB per chunk to be safe

    for (const [word, data] of entries) {
      const entrySize = new Blob([JSON.stringify({ [word]: data })]).size;

      if (
        currentSize + entrySize > maxChunkSize &&
        Object.keys(currentChunk).length > 0
      ) {
        chunks.push(currentChunk);
        currentChunk = {};
        currentSize = 0;
      }

      currentChunk[word] = data;
      currentSize += entrySize;
    }

    if (Object.keys(currentChunk).length > 0) {
      chunks.push(currentChunk);
    }

    // Save each chunk
    const savePromises = chunks.map((chunk, index) => {
      const docId =
        index === 0 ? "user-vocabulary" : `user-vocabulary-${index + 1}`;
      return firebaseRepo.setDoc(docId, chunk);
    });

    await Promise.all(savePromises);
    console.log(`Vocabulary saved in ${chunks.length} chunks`);

    // Clean up any extra chunks that are no longer needed
    await cleanupExtraChunks(chunks.length);
  };

  // Save vocabulary to Firestore
  const saveVocabularyToFirestore = async () => {
    try {
      if (modifiedEntries.value.size === 0 && deletedEntries.value.size === 0)
        return;

      // Get current document
      const currentDocData = await firebaseRepo.getById("user-vocabulary");
      const currentDoc: VocabularyDocument = {};

      if (currentDocData) {
        // Only copy vocabulary entries, exclude metadata fields like 'id'
        Object.keys(currentDocData).forEach((key) => {
          if (
            key !== "id" &&
            typeof currentDocData[key] === "object" &&
            currentDocData[key] !== null
          ) {
            const entry = currentDocData[key] as any;
            // Check if this looks like a vocabulary entry
            if (entry.translation && entry.addedAt && entry.language) {
              currentDoc[key] = entry;
            }
          }
        });
      }

      // Remove deleted entries
      deletedEntries.value.forEach((word: string) => {
        delete currentDoc[word];
      });

      // Update modified entries
      modifiedEntries.value.forEach((word: string) => {
        const entry = vocabulary.value.find((e) => e.word === word);
        if (entry) {
          currentDoc[word] = {
            translation: entry.translation,
            addedAt: entry.addedAt.toISOString(),
            language: entry.language,
            usageCount: entry.usageCount,
          };
        }
      });

      // Check document size and split if necessary
      const documentSize = new Blob([JSON.stringify(currentDoc)]).size;
      const maxSize = 900 * 1024; // 900KB to leave some buffer

      if (documentSize > maxSize) {
        // Split into chunks
        await saveVocabularyInChunks(currentDoc);
      } else {
        // Save as single document
        await firebaseRepo.setDoc("user-vocabulary", currentDoc);
      }

      // Clear tracking sets after successful save
      modifiedEntries.value.clear();
      deletedEntries.value.clear();

      console.log(
        `Vocabulary updated in Firestore (${
          modifiedEntries.value.size + deletedEntries.value.size
        } changes)`
      );
    } catch (error) {
      console.error("Error saving vocabulary to Firestore:", error);
    }
  };

  // Set up event listeners and load data
  // Loading is now handled in the journal page onMounted

  const modifiedCount = computed(() => modifiedEntries.value.size);
  const deletedCount = computed(() => deletedEntries.value.size);

  // Watch for language changes and reload vocabulary

  return {
    vocabulary: readonly(vocabulary),
    newlyAddedWords: readonly(newlyAddedWords),
    newWordsCount: readonly(newWordsCount),
    favoritedWords: readonly(favoritedWords),
    modifiedCount: readonly(modifiedCount),
    deletedCount: readonly(deletedCount),
    addWord,
    deleteWord,
    hasWord,
    getWordsForLanguage,
    clearVocabulary,
    clearNewWordsCount,
    clearNewlyAddedWords,
    toggleFavorite,
    isFavorited,
    totalWords,
    saveVocabularyToFirestore,
    loadVocabularyFromFirestore,
  };
};
