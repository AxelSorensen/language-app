import { ref } from "vue";
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

export function useEntries() {
  const entries = useState<DiaryEntry[]>("journal-entries", () => []);
  const { targetLanguage: settingsTargetLanguage } = useSettings();
  const currentTargetLanguage = computed(() => settingsTargetLanguage.value.id);
  const loading = ref(false);
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
      entries.value.push({ id, ...entryData });
    } catch (error) {
      console.error("❌ Error creating journal entry with ID:", error);
      throw error;
    }
  };

  const updateEntry = (id: string, entry: Partial<DiaryEntry>): void => {
    const index = entries.value.findIndex((e) => e.id === id);
    if (index >= 0) {
      entries.value[index] = { ...entries.value[index], ...entry };
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
      const index = entries.value.findIndex((e) => e.id === id);
      const savedEntry = {
        ...cleanEntry,
        id,
        updatedAt: new Date().toISOString(),
      };
      if (index >= 0) {
        entries.value[index] = savedEntry;
      } else {
        // Entry not in local state, add it
        entries.value.push(savedEntry);
      }
    } catch (error) {
      console.error("Error saving journal entry:", error);
      throw error;
    }
  };

  const loadEntry = async (id: string): Promise<DiaryEntry | null> => {
    try {
      const existing = entries.value.find((e) => e.id === id);
      if (existing) {
        return existing;
      }
      const entry = await firebaseRepo.getById(id);
      if (entry) {
        entries.value.push(entry);
      }
      return entry;
    } catch (error) {
      console.error("Error loading journal entry:", error);
      throw error;
    }
  };

  const getAllEntries = async (): Promise<DiaryEntry[]> => {
    try {
      loading.value = true;
      const fetchedEntries = await firebaseRepo.query([
        {
          field: "language",
          operator: "==",
          value: currentTargetLanguage.value,
        },
      ]);
      // Ensure all entries have createdAt field
      const processedEntries = fetchedEntries.map((entry) => ({
        ...entry,
        createdAt: entry.createdAt || new Date().toISOString(),
        wordCount: entry.wordCount || 0,
      }));

      // Update the reactive state
      entries.value = processedEntries;

      return processedEntries;
    } catch (error) {
      console.error("Error getting all journal entries:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteEntry = async (id: string): Promise<void> => {
    // Optimistically remove from local state first
    const index = entries.value.findIndex((e) => e.id === id);
    let deletedEntry: DiaryEntry | null = null;
    if (index >= 0) {
      deletedEntry = entries.value[index];
      entries.value.splice(index, 1);
    }

    try {
      await firebaseRepo.delete(id);
    } catch (error) {
      console.error("Error deleting journal entry from Firebase:", error);
      // If Firebase deletion fails, add the entry back to local state
      if (deletedEntry) {
        entries.value.splice(index, 0, deletedEntry);
      }
      throw error;
    }
  };

  // Watch for language changes and refetch entries
  watch(currentTargetLanguage, async (newLanguage, oldLanguage) => {
    if (newLanguage !== oldLanguage) {
      await getAllEntries();
    }
  });

  return {
    entries, // Keep for backward compatibility, but will be deprecated
    loading,
    createJournalEntry,
    saveEntry,
    loadEntry,
    getAllEntries,
    updateEntry,
    deleteEntry,
  };
}
