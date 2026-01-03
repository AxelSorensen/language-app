import { ref, nextTick, computed } from "vue";

export interface KeyboardState {
  isCapsLock: Ref<boolean>;
  postSentence: Ref<boolean>;
}

export interface KeyboardActions {
  toggleCapsLock: () => void;
}

export interface KeyboardComposable {
  state: KeyboardState;
  actions: KeyboardActions;
}

export function useKeyboard(): KeyboardComposable {
  // State
  const state = useState("keyboard-state", () => ({
    isCapsLock: false,
    postSentence: false,
  }));

  const pressKey = (button: string) => {
    const event = new KeyboardEvent("custom-keyboard-event", { key: button });
    document.dispatchEvent(event);
  };

  const toggleCapsLock = () => {
    state.value.isCapsLock = !state.value.isCapsLock;
  };

  return {
    state,
    actions: {
      pressKey,
      toggleCapsLock,
    },
  };
}
