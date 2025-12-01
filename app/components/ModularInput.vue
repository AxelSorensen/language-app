<template>
  <div
    class="flex flex-wrap max-w-[800px]"
    :class="{ 'animate-pulse': isCheckingSentence }"
  >
    <div
      v-for="(word, idx) in words || []"
      :key="word.id"
      class="relative group"
    >
      <input
        autofocus
        inputmode="none"
        :ref="(el) => setInputRef(idx, el as HTMLInputElement)"
        v-model="word.text"
        v-if="
          !(
            (translateMode || isTranslating) &&
            idx === currentFocusedIdx &&
            word.text.trim() === ''
          )
        "
        :placeholder="idx === 0 && words.length === 1 ? 'Start writing...' : ''"
        :class="[
          'mr-1 outline-none border-none field-sizing-content',
          { 'animate-pulse': word.status === 'pending' },
          word.correction
            ? 'text-orange-400'
            : word.translation === 'unknown'
            ? 'text-red-600'
            : '',
          word.sentenceError
            ? 'underline decoration-dashed decoration-gray-400 underline-offset-2'
            : '',
        ]"
        @input="saveSelection(idx)"
        @focus="currentFocusedIdx = idx"
        @keydown="handleKeyDown($event, idx)"
      />
      <input
        v-if="(translateMode || isTranslating) && idx === currentFocusedIdx"
        :ref="(el) => (translateInputRef = el)"
        autofocus
        class="outline-none border-none field-sizing-content text-2xl font-sans text-purple-500 mr-1"
        :class="[isTranslating ? 'animate-pulse' : '']"
        placeholder="words to translate..."
        :value="wordsToTranslate"
        @click="
          $nextTick(() =>
            ($event.target as HTMLInputElement).setSelectionRange(
              0,
              ($event.target as HTMLInputElement).value.length
            )
          )
        "
        @input="
          $emit(
            'update:wordsToTranslate',
            ($event.target as HTMLInputElement).value
          )
        "
        @keydown="handleTranslateKeyDown"
        @blur="$emit('blur-translate')"
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
  isCheckingSentence?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  words: () => [],
  isCheckingSentence: false,
});

const words = props.words;

const emit = defineEmits<{
  "input-created": [index: number];
  "process-current": [id: string];
  "delete-word": [index: number];
  "apply-correction": [index: number];
  "apply-sentence-correction": [];
  "check-sentence": [];
  "update:wordsToTranslate": [value: string];
  "blur-translate": [];
}>();

const translateInputRef = ref<HTMLInputElement>();

const currentFocusedIdx = ref(-1);

const inputsRefs = ref<HTMLInputElement[]>([]);
const setInputRef = (idx: number, el: HTMLInputElement | null) => {
  if (el) inputsRefs.value[idx] = el;
};

const typingTimeout = ref<NodeJS.Timeout | null>(null);

const applyCorrection = (idx: number) => {
  emit("apply-correction", idx);
};

const saveSelection = (idx: number) => {
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

const handleKeyDown = (event: KeyboardEvent, idx: number) => {
  const inputEl = event.target as HTMLInputElement;
  const cursorPos = inputEl.selectionStart || 0;
  const wordLength = words[idx].text.length;

  if (event.key === "ArrowLeft") {
    if (cursorPos === 0 && idx > 0) {
      event.preventDefault();
      focusOnEnd(idx - 1);
    }
  } else if (event.key === "ArrowRight") {
    if (cursorPos === wordLength && idx < words.length - 1) {
      event.preventDefault();
      focusOn(idx + 1);
    }
  }
};

const handleTranslateKeyDown = (event: KeyboardEvent) => {
  // For translate input, handle arrows normally (no special jumping)
};

defineExpose({
  focusOn,
  focusOnEnd,
  focusOnPosition,
  focusCurrent,
  translateInputRef,
  inputsRefs,
  currentFocusedIdx,
});
</script>
