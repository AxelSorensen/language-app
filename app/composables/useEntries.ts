import { ref, computed } from "vue";
import type { Word } from "~/types";
import { FirestoreRepository } from "~/repositories/FirestoreRepository";
import { useSettings } from "~/composables/useSettings";

export interface DiaryEntry {
  id?: string;
  text: string;
  wordCount: number;
  words: Word[];
  language?: string;
  createdAt?: string;
  updatedAt?: string;
}

const firebaseRepo = new FirestoreRepository<DiaryEntry>("journal_entries");

// Global cache for entries per language
const entriesCache = ref<Record<string, DiaryEntry[]>>({});

export function useEntries(languageId?: string) {
  const { targetLanguage: settingsTargetLanguage } = useSettings();
  const currentTargetLanguage = computed(() => settingsTargetLanguage.value.id);
  const loading = ref(false);

  // Computed entries for the current language
  const entries = computed(
    () => entriesCache.value[currentTargetLanguage.value] || []
  );

  const createJournalEntry = async (id: string): Promise<void> => {
    try {
      const entryData: Omit<DiaryEntry, "id"> = {
        text: "",
        wordCount: 0,
        words: [],
        language: currentTargetLanguage.value,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await firebaseRepo.setDoc(id, entryData);
      // Refresh the cache by fetching all entries for the current language
      await getLanguageEntries();
    } catch (error) {
      console.error("❌ Error creating journal entry with ID:", error);
      throw error;
    }
  };

  const updateEntry = (id: string, entry: Partial<DiaryEntry>): void => {
    const langEntries = entriesCache.value[currentTargetLanguage.value];
    if (langEntries) {
      const index = langEntries.findIndex((e) => e.id === id);
      if (index >= 0) {
        langEntries[index] = { ...langEntries[index], ...entry };
      }
    }
  };

  const saveEntry = async (id: string, entry: DiaryEntry): Promise<void> => {
    if (!id || id === "undefined") return;
    try {
      const cleanEntry = JSON.parse(JSON.stringify(entry));
      await firebaseRepo.update(id, {
        ...cleanEntry,
        updatedAt: new Date().toISOString(),
      });
      // Refresh the cache by fetching all entries for the current language
      await getLanguageEntries();
    } catch (error) {
      console.error("Error saving journal entry:", error);
      throw error;
    }
  };

  const loadEntry = async (id: string): Promise<DiaryEntry | null> => {
    try {
      const langEntries = entriesCache.value[currentTargetLanguage.value];
      if (langEntries) {
        const existing = langEntries.find((e) => e.id === id);
        if (existing) {
          return existing;
        }
      }
      const entry = await firebaseRepo.getById(id);
      if (entry) {
        // Refresh the cache by fetching all entries for the current language
        await getLanguageEntries();
      }
      return entry;
    } catch (error) {
      console.error("Error loading journal entry:", error);
      throw error;
    }
  };

  const getLanguageEntries = async (): Promise<DiaryEntry[]> => {
    const lang = currentTargetLanguage.value;
    // If entries are already cached for the current language, return them
    if (entriesCache.value[lang]) {
      console.log("Using cached journal entries for language:", lang);
      return entriesCache.value[lang];
    }
    console.log("Fetching journal entries for language:", lang);
    try {
      loading.value = true;
      const fetchedEntries = await firebaseRepo.query([
        {
          field: "language",
          operator: "==",
          value: lang,
        },
      ]);
      // Ensure all entries have createdAt field
      const processedEntries = fetchedEntries.map((entry) => ({
        ...entry,
        createdAt: entry.createdAt || new Date().toISOString(),
        wordCount: entry.wordCount || 0,
      }));

      // Cache the entries
      entriesCache.value[lang] = processedEntries;

      return processedEntries;
    } catch (error) {
      console.error("Error getting journal entries:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteEntry = async (id: string): Promise<void> => {
    const langEntries = entriesCache.value[currentTargetLanguage.value];
    // Optimistically remove from local state first (optional, for immediate UI update)
    let deletedEntry: DiaryEntry | null = null;
    if (langEntries) {
      const index = langEntries.findIndex((e) => e.id === id);
      if (index >= 0) {
        deletedEntry = langEntries[index];
        langEntries.splice(index, 1);
      }
    }

    try {
      await firebaseRepo.delete(id);
      // Refresh the cache by fetching all entries for the current language
      await getLanguageEntries();
    } catch (error) {
      console.error("Error deleting journal entry from Firebase:", error);
      // If Firebase deletion fails, add the entry back to local state
      if (deletedEntry && langEntries) {
        const index = langEntries.findIndex((e) => e.id === id);
        langEntries.splice(index, 0, deletedEntry);
      }
      throw error;
    }
  };

  return {
    entries,
    loading,
    createJournalEntry,
    saveEntry,
    loadEntry,
    getLanguageEntries,
    updateEntry,
    deleteEntry,
  };
}
