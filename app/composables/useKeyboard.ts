import { ref, nextTick, computed } from "vue";

export interface KeyboardState {
  isKeyboardVisible: Ref<boolean>;
  isCapsLock: Ref<boolean>;
  currentWordIndex: Ref<number | null>;
  translateMode: Ref<boolean>;
  translateInputFocused: Ref<boolean>;
}

export interface KeyboardActions {
  handleWordKeydown: (e: KeyboardEvent, idx: number) => void;
  handleTranslateKeydown: (e: KeyboardEvent) => void;
  pressKey: (button: string) => void;
  refocusCurrentInput: () => void;
  toggleTranslateMode: () => void;
  setKeyboardVisibility: (visible: boolean) => void;
  setCurrentWordIndex: (index: number | null) => void;
  toggleCapsLock: () => void;
}

export interface KeyboardComposable {
  state: KeyboardState;
  actions: KeyboardActions;
}

export function useKeyboard(): KeyboardComposable {
  // State
  const state = useState("keyboard-state", () => ({
    isKeyboardVisible: false,
    isCapsLock: false,
    currentWordIndex: null as number | null,
    translateMode: false,
    translateInputFocused: false,
  }));

  const pressKey = (button: string) => {
    const event = new KeyboardEvent("custom-keyboard-event", { key: button });
    document.dispatchEvent(event);
  };

  const refocusCurrentInput = () => {
    // Refocus the current input when keyboard is clicked
    nextTick(() => {
      if (
        state.value.currentWordIndex !== null &&
        state.value.currentWordIndex >= 0 &&
        state.value.currentWordIndex < words.value.length &&
        wordRefs.value[state.value.currentWordIndex]
      ) {
        wordRefs.value[state.value.currentWordIndex].focus();
      }
    });
  };

  const toggleTranslateMode = () => {
    state.value.translateMode = !state.value.translateMode;
    if (state.value.translateMode) {
      state.value.translateInputFocused = true;
      nextTick(() => {
        translateInputRef.value?.focus();
      });
    } else {
      state.value.translateInputFocused = false;
    }
  };

  const setKeyboardVisibility = (visible: boolean) => {
    state.value.isKeyboardVisible = visible;
  };

  const setCurrentWordIndex = (index: number | null) => {
    state.value.currentWordIndex = index;
  };

  const toggleCapsLock = () => {
    state.value.isCapsLock = !state.value.isCapsLock;
  };

  // Helper function for word input handling (extracted from component)
  const handleWordInput = (event: any) => {
    const currentIdx = state.value.currentWordIndex;

    // Handle spaces immediately when they appear in input
    if (currentIdx !== null && words.value[currentIdx].text.includes(" ")) {
      const parts = words.value[currentIdx].text
        .split(/\s+/)
        .filter((word: string) => word.trim() !== "");
      if (parts.length > 1) {
        // Multiple words - split them
        words.value[currentIdx].text = parts[0];
        for (let i = 1; i < parts.length; i++) {
          words.value.splice(currentIdx + i, 0, {
            id: generateWordId(),
            text: parts[i],
          });
        }
        // Add empty input at the end
        words.value.splice(currentIdx + parts.length, 0, {
          id: generateWordId(),
          text: "",
        });
        nextTick(() => {
          wordRefs.value[currentIdx + parts.length]?.focus();
        });
      } else {
        // Just one word followed by space(s) - create new empty input
        words.value[currentIdx].text = parts[0];
        handleSpace(currentIdx);
      }
      return;
    }

    // Trigger spell check and other validations
    setTimeout(() => {
      const currentIdx = currentWordIndex.value;
      if (currentIdx !== null) {
        spellCheck(words.value[currentIdx], currentIdx);
        grammarCheck();
        translateFullSentence();
      }
    }, 1000);
  };

  return {
    state,
    actions: {
      handleWordKeydown: () => {}, // stub
      handleTranslateKeydown: () => {}, // stub
      pressKey,
      refocusCurrentInput,
      toggleTranslateMode,
      setKeyboardVisibility,
      setCurrentWordIndex,
      toggleCapsLock,
    },
  };
}
