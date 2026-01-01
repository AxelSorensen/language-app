import { ref } from "vue";
import type { Word } from "~/types";
import { FirestoreRepository } from "~/repositories/FirestoreRepository";

export interface DiaryEntry {
  id?: string;
  text: string;
  wordCount: number;
  words: Word[];
  createdAt?: string;
  updatedAt?: string;
}

const firebaseRepo = new FirestoreRepository<DiaryEntry>("journal_entries");

export function useEntries() {
  const entries = useState<DiaryEntry[]>(
    "journal-entries",
    () => []
  );
  const createJournalEntry = async (id: string): Promise<void> => {
    try {
      const entryData: Omit<DiaryEntry, "id"> = {
        text: "",
        words: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log(
        "Creating journal entry with ID in Firestore:",
        id,
        entryData
      );
      await firebaseRepo.setDoc(id, entryData);
      entries.value.push({ id, ...entryData });
      console.log(
        `✅ Created new journal entry with ID: ${id} for date: ${entryData.date}`
      );
    } catch (error) {
      console.error("❌ Error creating journal entry with ID:", error);
      throw error;
    }
  };

  const updateEntry = (id: string, entry: Partial<DiaryEntry>): void => {
    const index = entries.value.findIndex(e => e.id === id);
    if (index >= 0) {
      entries.value[index] = { ...entries.value[index], ...entry };
    }
  };

  const saveEntry = async (id: string, entry: DiaryEntry): Promise<void> => {
    if (!id || id === 'undefined') return;
    try {
      const cleanEntry = JSON.parse(JSON.stringify(entry));
      await firebaseRepo.update(id, {
        ...cleanEntry,
        updatedAt: new Date().toISOString(),
      });
      const index = entries.value.findIndex(e => e.id === id);
      if (index >= 0) {
        entries.value[index] = { ...cleanEntry, updatedAt: new Date().toISOString() };
      }
    } catch (error) {
      console.error("Error saving journal entry:", error);
      throw error;
    }
  };

  const loadEntry = async (id: string): Promise<DiaryEntry | null> => {
    try {
      const existing = entries.value.find(e => e.id === id);
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
      return await firebaseRepo.getAll();
    } catch (error) {
      console.error("Error getting all journal entries:", error);
      throw error;
    }
  };

  return {
    entries, // Keep for backward compatibility, but will be deprecated
    createJournalEntry,
    saveEntry,
    loadEntry,
    getAllEntries,
    updateEntry,
  };
}
