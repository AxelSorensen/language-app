import { ref } from "vue";
import type { Word } from "~/types";

export interface DiaryEntry {
  date: string;
  text: string;
  wordCount: number;
  words: Word[];
}

const entries = ref<Record<string, DiaryEntry>>({});

export function useEntries() {
  return {
    entries,
  };
}
