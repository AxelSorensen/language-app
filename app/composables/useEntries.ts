import { ref } from "vue";

export interface DiaryEntry {
  date: string;
  text: string;
  wordCount: number;
}

const entries = ref<Record<string, DiaryEntry>>({});

export function useEntries() {
  return {
    entries,
  };
}
