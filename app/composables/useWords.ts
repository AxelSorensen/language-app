import { ref, computed, nextTick, type Ref, watch } from "vue";
import { generateRandomId } from "~/utils/misc";

export interface Word {
  id: string;
  text: string;
  correction?: string | null;
  translation?: string | null;
  status: "empty" | "pending" | "checked" | "error" | "idle";
}

export interface GrammarErrors {
  wrong_text?: string;
  correction?: string;
  explanation?: string;
}

export interface WordsComposable {
  state: Ref<State>;
  actions: {
    reset: () => void;
    addWord: (idx: number) => void;
    addWords: (idx: number, words: string[]) => void;
    replaceWord: (idx: number, newWord: string) => void;
    deleteWord: (wordIndex: number) => void;
    setCurrentInputIndex: (index: number | null) => void;
    getWordContext: (wordIndex: number) => string;
    getWordIndicesForSentence: (sentenceText: string) => number[];
    onTypingTimeout: (callback: () => void) => void;
    onSentenceCreated: (callback: () => void) => void;
  };
  refs: Ref<Record<number, any>>;
  computed: {
    sentences: Ref<string[]>;
    hasText: Ref<boolean>;
    currentInputValue: Ref<string>;
  };
}

// Handles space: add word and focus the new input

export interface State {
  words: Word[];
  translatedSentence: string;
  errors: GrammarErrors[] | null;
  typingTimeout: ReturnType<typeof setTimeout> | null;
  current_input_index: number | null;
}

export function useWords(): WordsComposable {
  // State
  const state = useState<State>("words-state", () => ({
    words: [
      {
        id: "first",
        text: "",
        status: "empty",
        correction: null,
        translation: null,
      },
    ],
    errors: [],
    translatedSentence: "",
    typingTimeout: null as ReturnType<typeof setTimeout> | null,
    current_input_index: null,
  }));

  const refs = useState<Record<number, any>>("words-refs", () => ({}));

  function setCurrentInputIndex(index: number | null): void {
    console.log("WFDADAW", index);
    state.value.current_input_index = index;
  }

  const resetState = () => {
    // Clear any pending timeout
    if (state.value.typingTimeout) {
      clearTimeout(state.value.typingTimeout);
    }
    // Reset all state to initial values
    state.value = {
      translateMode: false,
      words: [
        {
          id: "first",
          text: "",
          status: "empty",
          correction: null,
          translation: null,
        },
      ],
      errors: [],
      translatedSentence: "",
      typingTimeout: null,
      current_input_index: null,
    };
  };

  // Computed properties
  const sentences = computed(() => {
    const fullText = state.value.words.map((w) => w.text).join(" ");
    return fullText
      .split(".")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  });

  const hasText = computed(() => {
    return state.value.words.some((word) => word.text.trim() !== "");
  });

  const currentInputValue = computed(() => {
    // This will be set by the component when keyboard state is available
    return "";
  });

  function getWordContext(wordIndex: number): string {
    if (wordIndex < 0 || wordIndex >= state.value.words.length) return "";

    // Find sentence boundaries by looking for words ending with "."
    const sentenceStartIndices = [0];
    for (let i = 0; i < state.value.words.length; i++) {
      const word = state.value.words[i];
      if (word && word.text.trim().endsWith(".")) {
        sentenceStartIndices.push(i + 1);
      }
    }

    // Find which sentence this word belongs to
    let sentenceStart = 0;
    for (const startIdx of sentenceStartIndices) {
      if (wordIndex >= startIdx) {
        sentenceStart = startIdx;
      } else {
        break;
      }
    }

    // Find the end of this sentence
    let sentenceEnd = state.value.words.length;
    for (let i = sentenceStart; i < state.value.words.length; i++) {
      const word = state.value.words[i];
      if (word && word.text.trim().endsWith(".")) {
        sentenceEnd = i + 1;
        break;
      }
    }

    // Extract words for this sentence
    const sentenceWords = state.value.words.slice(sentenceStart, sentenceEnd);
    return sentenceWords
      .map((w) => w?.text || "")
      .join(" ")
      .trim();
  }

  function getWordIndicesForSentence(sentenceText: string): number[] {
    const fullText = state.value.words.map((w) => w?.text || "").join(" ");
    const sentenceStart = fullText.indexOf(sentenceText);
    if (sentenceStart === -1) return [];

    const sentenceEnd = sentenceStart + sentenceText.length;
    const indices: number[] = [];

    let charCount = 0;
    for (let i = 0; i < state.value.words.length; i++) {
      const word = state.value.words[i];
      if (!word) continue;

      const wordStart = charCount;
      const wordEnd = charCount + word.text.length;
      charCount += word.text.length + 1; // +1 for space

      // Check if this word overlaps with the sentence
      if (wordStart < sentenceEnd && wordEnd > sentenceStart) {
        indices.push(i);
      }
    }

    return indices;
  }

  function addWords(idx: number, words: string[]): void {
    const newWords: Word[] = words.map((word) => ({
      id: generateRandomId(),
      text: word,
      status: word.length === 0 ? "empty" : "idle",
      correction: null,
      translation: null,
    }));
    state.value.words.splice(idx, 0, ...newWords);
    nextTick(() => {
      // Focus the input at the last added word
      const lastIdx = idx + words.length - 1;
      if (refs.value && refs.value[lastIdx]) {
        const input = refs.value[lastIdx];
        if (input && typeof input.focus === "function") {
          input.focus();
        }
      }
    });
  }

  function addWord(idx: number, word: string = "", autofocus = true): void {
    // Add a new word after the current one
    state.value.words.splice(idx + 1, 0, {
      id: generateRandomId(),
      text: word,
      status: word.length === 0 ? "empty" : "idle",
      correction: null,
      translation: null,
    });
    nextTick(() => {
      // Focus the input at the next index in refs
      if (refs.value && refs.value[idx + 1] && autofocus) {
        const nextInput = refs.value[idx + 1];
        if (nextInput && typeof nextInput.focus === "function") {
          nextInput.focus();
        }
      }
    });
  }

  // Debounced check: calls the provided callback after debounce period
  let typingCallback: (() => void) | null = null;
  let sentenceCallback: (() => void) | null = null;
  function onTypingTimeout(callback: () => void) {
    typingCallback = callback;
    resetTypingTimeout();
  }

  function onSentenceCreated(callback: () => void) {
    sentenceCallback = callback;
  }

  function resetTypingTimeout() {
    if (state.value.typingTimeout) {
      clearTimeout(state.value.typingTimeout);
    }
    state.value.typingTimeout = setTimeout(() => {
      if (typeof typingCallback === "function") {
        typingCallback();
      }
    }, 1000);
  }

  // Watch words and reset timeout on change
  watch(
    () => state.value.words.map((w) => w.text),
    (newWords, oldWords) => {
      if (typeof typingCallback === "function") {
        resetTypingTimeout();
      }

      // Check if there are more periods now than before (new sentence created)
      if (oldWords) {
        const oldPeriodCount = oldWords.join("").split(".").length - 1;
        const newPeriodCount = newWords.join("").split(".").length - 1;

        if (
          newPeriodCount > oldPeriodCount &&
          typeof sentenceCallback === "function"
        ) {
          sentenceCallback();
        }
      }
    },
    { deep: true }
  );

  function deleteWord(wordIndex: number): void {
    // This will be implemented when we have keyboard state
    state.value.words.splice(wordIndex, 1);
  }

  function replaceWord(idx: number, newWord: string): void {}

  const actions = {
    reset: resetState,
    addWord,
    addWords,
    replaceWord,
    deleteWord,
    getWordContext,
    getWordIndicesForSentence,
    setCurrentInputIndex,
    onTypingTimeout,
    onSentenceCreated,
  };

  return {
    state,
    actions,
    refs,
    computed: {
      sentences,
      hasText,
      currentInputValue,
    },
  };
}
