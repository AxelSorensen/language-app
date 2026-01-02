import { ref, computed, watch } from "vue";

export interface ModularInput {
  text: string;
}

export interface UseModularInputOptions {
  initialText?: string;
  splitOn?: string; // Default to ' ' (space)
  onTypingTimeout?: (fullText: string) => void;
  typingTimeoutDelay?: number;
}

export function useModularInput(options: UseModularInputOptions = {}) {
  const {
    initialText = "",
    splitOn = " ",
    onTypingTimeout,
    typingTimeoutDelay = 1000,
  } = options;

  const inputs = ref<ModularInput[]>(
    initialText
      ? initialText.split(splitOn).map((text) => ({ text }))
      : [{ text: "" }]
  );
  const inputsRefs = ref<HTMLInputElement[]>([]);
  const currentInputIndex = ref(0);

  const fullText = computed(() =>
    inputs.value.map((i) => i.text).join(splitOn)
  );

  const timeoutId = ref<NodeJS.Timeout | null>(null);

  watch(fullText, () => {
    if (timeoutId.value) clearTimeout(timeoutId.value);
    if (onTypingTimeout) {
      timeoutId.value = setTimeout(() => {
        onTypingTimeout(fullText.value);
      }, typingTimeoutDelay);
    }
  });

  const setCurrentInputIndex = (index: number) => {
    currentInputIndex.value = index;
  };

  const focusInput = (index: number) => setCurrentInputIndex(index);

  const blurInput = (index: number) => {};

  const deleteInput = (index: number) => {
    inputs.value.splice(index, 1);
  };

  const addInput = (text: string) => {
    inputs.value.push({ text });
  };

  return {
    inputs,
    inputsRefs,
    currentInputIndex,
    fullText,
    focusInput,
    blurInput,
    deleteInput,
    addInput,
  };
}
