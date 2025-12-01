<template>
  <div class="flex">
    <div
      v-for="(word, idx) in words || []"
      :key="word.id"
      class="relative group"
    >
      <input
        v-if="!(!word.text && (isTranslating || translateMode))"
        autofocus
        :ref="(el) => setInputRef(idx, el as HTMLInputElement)"
        v-model="word.text"
        :placeholder="idx === 0 && words.length === 1 ? 'Start writing...' : ''"
        :class="[
          'mr-1 outline-none border-none field-sizing-content',
          { 'animate-pulse': word.status === 'pending' },
          word.correction
            ? 'text-green-600'
            : word.translation === 'unknown'
            ? 'text-red-600'
            : '',
          word.sentenceError
            ? 'underline decoration-dashed decoration-gray-400 underline-offset-2'
            : '',
        ]"
        @input="saveSelection(idx)"
        @focus="currentFocusedIdx = idx"
        @keydown="handleKeydown($event, idx)"
      />
      <SimpleTooltip
        :text="
          word.correction ||
          (word.sentenceError
            ? word.sentenceError.correction +
              ' (' +
              word.sentenceError.explanation +
              ')'
            : '') ||
          word.translation ||
          ''
        "
        :type="
          word.correction
            ? 'correction'
            : word.translation === 'unknown'
            ? 'unknown'
            : word.sentenceError
            ? 'sentence'
            : 'translation'
        "
        :enabled="!!(word.correction || word.sentenceError || word.translation)"
        @click="
          word.correction
            ? applyCorrection(idx)
            : word.sentenceError
            ? $emit('apply-sentence-correction')
            : undefined
        "
        @deleteWord="$emit('delete-word', idx)"
      />
    </div>
    <input
      inputmode="none"
      v-if="translateMode || isTranslating"
      ref="translateInputRef"
      class="outline-none border-none field-sizing-content text-2xl font-sans text-purple-500"
      :class="[isTranslating ? 'animate-pulse' : '']"
      placeholder="words to translate..."
      :value="wordsToTranslate"
      @input="
        $emit(
          'update:wordsToTranslate',
          ($event.target as HTMLInputElement).value
        )
      "
    />
  </div>
</template>

<script setup lang="ts">
import { watch, nextTick } from "vue";
import SimpleTooltip from "~/components/SimpleTooltip.vue";
import { useState } from "#app";

interface Props {
  words?: any[]; // or Word[]
  translateMode?: boolean;
  isTranslating?: boolean;
  wordsToTranslate?: string;
}

const props = withDefaults(defineProps<Props>(), {
  words: () => [],
});

const words = props.words;

const emit = defineEmits<{
  "input-created": [index: number];
  "process-current": [id: string];
  "delete-word": [index: number];
  "apply-correction": [index: number];
  "apply-sentence-correction": [];
  "break-word": [{ idx: number; cursorPos: number }];
  "merge-words": [index: number];
  "add-word-after": [index: number];
  "check-sentence": [];
  "update:wordsToTranslate": [value: string];
}>();

const translateInputRef = ref<HTMLInputElement>();

const currentFocusedIdx = ref(-1);

const inputsRefs = ref<HTMLInputElement[]>([]);
const setInputRef = (idx: number, el: HTMLInputElement | null) => {
  if (el) inputsRefs.value[idx] = el;
};

const selections = useState<Record<number, { start: number; end: number }>>(
  "input-selections",
  () => ({})
);

const typingTimeout = ref<NodeJS.Timeout | null>(null);

const applyCorrection = (idx: number) => {
  emit("apply-correction", idx);
};

const breakWord = (
  inputEl: HTMLInputElement,
  idx: number,
  cursorPos: number
) => {
  emit("break-word", { idx, cursorPos });
};

const mergeWords = (idx: number) => {
  emit("merge-words", idx);
};

const handleSpace = (inputEl: HTMLInputElement, idx: number) => {
  const cursorPos = inputEl.selectionStart || 0;
  if (cursorPos < words[idx].text.length) {
    breakWord(inputEl, idx, cursorPos);
  } else if (words[idx].text.trim()) {
    // Process the current word before adding new
    emit("process-current", words[idx].id);
    // Add new input after if at end
    emit("add-word-after", idx);
  }
};

const handleBackspace = (inputEl: HTMLInputElement, idx: number) => {
  const hasSelection = inputEl.selectionStart !== inputEl.selectionEnd;
  if (hasSelection) {
    // Delete selection
    const start = inputEl.selectionStart || 0;
    const end = inputEl.selectionEnd || 0;
    words[idx].text =
      words[idx].text.slice(0, start) + words[idx].text.slice(end);
    inputEl.value = words[idx].text;
    inputEl.selectionStart = inputEl.selectionEnd = start;
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  if (!words[idx].text && idx > 0) {
    // If backspace on empty input, remove it and focus previous at end
    emit("delete-word", idx);
  } else if (inputEl.selectionStart === 0 && idx > 0) {
    // Merge with previous input
    mergeWords(idx);
  } else {
    // Delete previous character
    const start = inputEl.selectionStart || 0;
    if (start > 0) {
      words[idx].text =
        words[idx].text.slice(0, start - 1) + words[idx].text.slice(start);
      inputEl.value = words[idx].text;
      inputEl.selectionStart = inputEl.selectionEnd = start - 1;
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
};

const handleArrowLeft = (
  event: KeyboardEvent,
  inputEl: HTMLInputElement,
  idx: number
) => {
  if (inputEl.selectionStart === 0 && idx > 0) {
    event.preventDefault();
    const prevInput = inputsRefs.value[idx - 1];
    if (prevInput) {
      prevInput.focus();
      const len = words[idx - 1].text.length;
      prevInput.setSelectionRange(len, len);
    }
  }
};

const handleArrowRight = (
  event: KeyboardEvent,
  inputEl: HTMLInputElement,
  idx: number
) => {
  if (
    inputEl.selectionStart === inputEl.value.length &&
    idx < words.length - 1
  ) {
    event.preventDefault();
    const nextInput = inputsRefs.value[idx + 1];
    if (nextInput) {
      nextInput.focus();
      nextInput.setSelectionRange(0, 0);
    }
  }
};

const handleKeydown = (event: KeyboardEvent, idx: number) => {
  const inputEl = event.target as HTMLInputElement;
  if (event.key === " ") {
    event.preventDefault();
    handleSpace(inputEl, idx);
  } else if (event.key === ".") {
    emit("check-sentence");
  } else if (event.key === "Backspace") {
    if (hasSelection(inputEl)) {
      // Allow default delete for selection
      return;
    }
    if (isEmptyInput(idx) && idx > 0) {
      event.preventDefault();
      handleBackspace(inputEl, idx);
    } else if (isAtStart(inputEl, idx)) {
      event.preventDefault();
      handleBackspace(inputEl, idx);
    } else {
      // Allow default backspace
    }
  } else if (event.key === "ArrowLeft") {
    handleArrowLeft(event, inputEl, idx);
  } else if (event.key === "ArrowRight") {
    handleArrowRight(event, inputEl, idx);
  }
};

const hasSelection = (inputEl: HTMLInputElement) =>
  inputEl.selectionStart !== inputEl.selectionEnd;
const isEmptyInput = (idx: number) => idx < words.length && !words[idx].text;
const isAtStart = (inputEl: HTMLInputElement, idx: number) =>
  inputEl.selectionStart === 0 && idx > 0 && idx < words.length;

const saveSelection = (idx: number) => {
  const inputEl = inputsRefs.value[idx];
  if (inputEl) {
    selections.value[idx] = {
      start: inputEl.selectionStart || 0,
      end: inputEl.selectionEnd || 0,
    };
  }
  // Set status to idle on input
  words[idx].status = "idle";
  // Manage typing timeout
  if (typingTimeout.value) clearTimeout(typingTimeout.value);
  typingTimeout.value = setTimeout(() => {
    emit("process-current", words[idx].id);
  }, 1000);
};

const focusOn = (idx: number) => {
  nextTick(() => {
    const inputEl = inputsRefs.value[idx];
    if (inputEl) {
      inputEl.focus();
      inputEl.setSelectionRange(0, 0);
    }
  });
};

const focusOnEnd = (idx: number) => {
  nextTick(() => {
    const inputEl = inputsRefs.value[idx];
    if (inputEl) {
      inputEl.focus();
      const len = words[idx].text.length;
      inputEl.setSelectionRange(len, len);
    }
  });
};

const focusOnPosition = (idx: number, start: number, end: number) => {
  nextTick(() => {
    const inputEl = inputsRefs.value[idx];
    if (inputEl) {
      inputEl.focus();
      inputEl.setSelectionRange(start, end);
    }
  });
};

const focusCurrent = () => {
  const input = inputsRefs.value[currentFocusedIdx.value];
  if (input) input.focus();
};

defineExpose({
  focusOn,
  focusOnEnd,
  focusOnPosition,
  focusCurrent,
  translateInputRef,
  handleSpace,
  handleBackspace,
  inputsRefs,
});
</script>
