<template>
  <div
    class="flex flex-wrap justify-center max-w-[800px] max-h-96 overflow-y-auto"
    :class="{ 'animate-pulse': props.isCheckingSentence }"
    @keydown.stop="handleKeyDown"
  >
    <div
      v-for="(word, idx) in words || []"
      :key="word.id"
      class="relative group"
      @mouseenter="handleMouseEnter(idx)"
      @mouseleave="handleMouseLeave(idx)"
      @click="handleWordClick(idx)"
    >
      <input
        v-if="word.text !== '' || (!props.translateMode && !isTranslating)"
        autofocus
        inputmode="none"
        :ref="(el) => setInputRef(idx, el as HTMLInputElement)"
        v-model="word.text"
        :placeholder="
          idx === 0 && words.length === 1
            ? props.targetLanguage
              ? $t('writeInLanguage', { language: props.targetLanguage.name })
              : $t('startWriting')
            : ''
        "
        :class="[
          'mr-1 outline-none border-none field-sizing-content',
          { 'animate-pulse': word.status === 'pending' },
          word.text === $t('generatingSuggestion')
            ? 'text-yellow-500 animate-pulse'
            : '',
          word.correction
            ? 'text-orange-400'
            : word.translation === 'unknown'
            ? 'text-red-600'
            : '',
          word.sentenceError
            ? 'underline decoration-dashed decoration-gray-400 underline-offset-2'
            : '',
        ]"
        :disabled="props.translateMode"
        @input="saveSelection(idx)"
        @focus="
          currentFocusedIdx = idx;
          $emit('focus-changed', idx);
        "
      />
      <input
        v-if="
          ((props.translateMode || props.isTranslating) &&
            idx === currentFocusedIdx) ||
          words?.length === 0
        "
        inputmode="none"
        :ref="(el) => (translateInputRef = el)"
        autofocus
        class="outline-none border-none field-sizing-content text-2xl font-sans text-purple-500 mr-1"
        :class="[isTranslating ? 'animate-pulse' : '']"
        :placeholder="$t('wordsToTranslate')"
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
        @blur="$emit('blur-translate')"
      />
      <SimpleTooltip
        :ref="(el) => (tooltipRefs[idx] = el)"
        :text="
          word.correction ||
          (word.sentenceError ? word.sentenceError.correction : '') ||
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
        :class="{
          'opacity-100': hoveredIdx === idx || touchActivatedIdx === idx,
        }"
        @applyCorrection="applyCorrection(idx)"
        @applySentenceCorrection="handleApplySentenceCorrection"
        @deleteWord="handleDeleteWord(idx)"
        @close="handleTooltipClose"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, nextTick } from "vue";
import SimpleTooltip from "~/components/SimpleTooltip.vue";
import { useState } from "#app";
import { generateRandomId } from "~/utils/misc";
import type { Word } from "~/types";

interface Props {
  translateMode?: boolean;
  isTranslating?: boolean;
  wordsToTranslate?: string;
  isCheckingSentence?: boolean;
  targetLanguage?: { name: string; id: string };
}

const props = withDefaults(defineProps<Props>(), {});

const words = defineModel<Word[]>("words");

const emit = defineEmits<{
  "update:wordsToTranslate": [value: string];
  "blur-translate": [];
  tab: [idx: number];
  space: [data: { id: string; fullText: string }];
  dot: [];
  suggest: [];
  "process-word": [data: { id: string; fullText: string }];
  "cancel-processing": [id: string];
  "check-sentence": [];
}>();
const getCurrentWordPosition = () => {
  const currentInput = inputsRefs.value[currentFocusedIdx.value];
  if (currentInput) {
    return currentInput.getBoundingClientRect();
  }
  return null;
};

const getHoveredWordPosition = () => {
  if (hoveredIdx.value !== null) {
    const hoveredInput = inputsRefs.value[hoveredIdx.value];
    if (hoveredInput) {
      return hoveredInput.getBoundingClientRect();
    }
  }
  return null;
};
const translateInputRef = ref<HTMLInputElement>();

const currentFocusedIdx = ref(0);

const hoveredIdx = ref<number | null>(null);
const touchActivatedIdx = ref<number | null>(null);

const inputsRefs = ref<HTMLInputElement[]>([]);
const setInputRef = (idx: number, el: HTMLInputElement | null) => {
  if (el) inputsRefs.value[idx] = el;
};

const tooltipRefs = ref<any[]>([]);

const lastSelection = ref<{ idx: number; start: number; end: number } | null>(
  null
);

watch(
  [() => props.translateMode, () => props.isTranslating],
  (
    [newTranslateMode, newIsTranslating],
    [oldTranslateMode, oldIsTranslating]
  ) => {
    if (
      oldIsTranslating &&
      !newIsTranslating &&
      !newTranslateMode &&
      lastSelection.value
    ) {
      // Translating done and translate mode off, restore focus
    } else if (!oldTranslateMode && newTranslateMode) {
      // Tran
      // slate mode turned on, save current selection
      nextTick(() => {
        focusOnPosition(
          lastSelection.value!.idx,
          lastSelection.value!.start,
          lastSelection.value!.end
        );
      });
      const activeElement = document.activeElement as HTMLInputElement;
      if (activeElement && activeElement.tagName === "INPUT") {
        const idx = inputsRefs.value.findIndex((el) => el === activeElement);
        if (idx !== -1) {
          lastSelection.value = {
            idx,
            start: activeElement.selectionStart || 0,
            end: activeElement.selectionEnd || 0,
          };
        }
      }
    }
  }
);

const typingTimeout = ref<NodeJS.Timeout | null>(null);

const isCheckingSentenceLocal = ref(false);

const applyCorrection = (idx: number) => {
  handleApplyCorrection(idx);
};

const saveSelection = (idx: number) => {
  if (!words.value || !words.value[idx]) return;
  // Cancel any ongoing processing for this word
  emit("cancel-processing", words.value[idx].id);
  // Set status to idle on input
  words.value[idx].status = "idle";
  // Reset correction and translation on input
  words.value[idx].correction = null;
  words.value[idx].translation = null;
  // Close any open tooltips when typing
  hoveredIdx.value = null;
  touchActivatedIdx.value = null;
  // Start typing timeout for processing
  if (typingTimeout.value) clearTimeout(typingTimeout.value);
  typingTimeout.value = setTimeout(() => {
    emit("typing-timeout", {
      id: words.value[idx].id,
      fullText: words.value.map((w) => w.text).join(" "),
    });
  }, 500); // Process after 1 second of inactivity
};

const handleSpace = (inputEl: HTMLInputElement, idx: number) => {
  if (props.translateMode) return; // Do not create new words in translate mode

  const word = words.value[idx];
  if (!word || word.text.trim() === "") return; // Prevent space in empty words

  const cursorPos = inputEl.selectionStart || 0;
  const wordLength = word.text.length;

  if (cursorPos === 0) {
    // At the beginning, just add new word before
    words.value.splice(idx, 0, {
      text: "",
      id: generateRandomId(),
      correction: null,
      translation: null,
      status: "idle",
      sentenceError: null,
    });
    nextTick(() => {
      focusOnPosition(idx, 0);
    });
  } else if (cursorPos < wordLength) {
    // In the middle, break the word
    handleBreakWord({ idx, cursorPos });
  } else {
    // At the end, process current word and add new
    if (word.text.trim() !== "" && word.status === "idle") {
      emit("process-word", {
        id: word.id,
        fullText: words.value.map((w) => w.text).join(" "),
      });
    }
    if (word.text.trim() !== "") {
      // Only add new word if current word is not empty
      words.value.splice(idx + 1, 0, {
        text: "",
        id: generateRandomId(),
        correction: null,
        translation: null,
        status: "idle",
        sentenceError: null,
      });
      nextTick(() => {
        focusOnPosition(idx + 1, 0);
      });
    } else {
      // If current word is empty, move to next word if it exists
      if (idx < words.value.length - 1) {
        nextTick(() => {
          focusOn(idx + 1);
        });
      }
      // If no next word, do nothing
    }
  }
};

const handleBackspace = (inputEl: HTMLInputElement, idx: number) => {
  if (!words.value || words.value.length === 0) return;
  const start = inputEl.selectionStart || 0;
  const end = inputEl.selectionEnd || 0;
  if (idx >= 0 && start === 0 && end === 0 && idx > 0) {
    // At start of word, merge with previous
    handleMergeWords(idx);
  } else {
    // Delete selection or character before cursor
    const value = inputEl.value;
    if (start !== end) {
      inputEl.value = value.slice(0, start) + value.slice(end);
      inputEl.selectionStart = inputEl.selectionEnd = start;
    } else if (start > 0) {
      inputEl.value = value.slice(0, start - 1) + value.slice(start);
      inputEl.selectionStart = inputEl.selectionEnd = start - 1;
    }
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
  }
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
    if (inputEl && words.value[idx]) {
      inputEl.focus();
      const len = words.value[idx].text.length;
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
  if (
    currentFocusedIdx.value === -1 ||
    currentFocusedIdx.value >= words.value.length
  ) {
    currentFocusedIdx.value = 0;
  }
  const input = inputsRefs.value[currentFocusedIdx.value];
  if (input) input.focus();
};

const handleKeyDown = (event: KeyboardEvent) => {
  event.stopPropagation();
  // Determine the target input element
  let inputEl: HTMLInputElement | null = event.target as HTMLInputElement;
  const isVirtual = !inputEl || inputEl.tagName !== "INPUT";

  if (isVirtual) {
    // For virtual events, determine target based on mode
    if (props.translateMode) {
      inputEl = translateInputRef.value;
    } else {
      inputEl = inputsRefs.value[currentFocusedIdx.value] || null;
      if (!inputEl && inputsRefs.value.length > 0) {
        currentFocusedIdx.value = 0;
        inputEl = inputsRefs.value[0];
        inputEl?.focus();
      }
    }
  }

  if (!inputEl) return; // No valid target

  const cursorPos = inputEl.selectionStart || 0;
  const wordLength =
    isVirtual || props.translateMode
      ? 0
      : words.value[currentFocusedIdx.value]?.text.length || 0;

  // Skip special handling in translate mode for virtual events
  if (props.translateMode && isVirtual) {
    // For virtual in translate mode, handle keys normally
    if (event.key === "Backspace") {
      const start = inputEl.selectionStart || 0;
      const end = inputEl.selectionEnd || 0;
      if (start !== end) {
        // Delete selection
        inputEl.value =
          inputEl.value.slice(0, start) + inputEl.value.slice(end);
        inputEl.selectionStart = inputEl.selectionEnd = start;
      } else if (start > 0) {
        // Delete previous character
        inputEl.value =
          inputEl.value.slice(0, start - 1) + inputEl.value.slice(start);
        inputEl.selectionStart = inputEl.selectionEnd = start - 1;
      }
    } else if (event.key === "Tab") {
      // Call handleTab for tab in translate mode
      handleTab();
    } else {
      // Insert the key (including space)
      const start = inputEl.selectionStart || 0;
      const end = inputEl.selectionEnd || 0;
      const value = inputEl.value;
      inputEl.value = value.slice(0, start) + event.key + value.slice(end);
      inputEl.selectionStart = inputEl.selectionEnd = start + event.key.length;
    }
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    inputEl.focus();
    return;
  }

  if (event.key === "Tab") {
    event.preventDefault();
    handleTab();
  } else if (!props.translateMode && event.key === "ArrowLeft") {
    if (cursorPos === 0 && currentFocusedIdx.value > 0) {
      event.preventDefault();
      focusOnEnd(currentFocusedIdx.value - 1);
    }
  } else if (!props.translateMode && event.key === "ArrowRight") {
    if (
      cursorPos === wordLength &&
      currentFocusedIdx.value < words.value.length - 1
    ) {
      event.preventDefault();
      focusOn(currentFocusedIdx.value + 1);
    }
  } else if (event.key === " ") {
    if (!props.translateMode) {
      event.preventDefault();
      handleSpace(inputEl, currentFocusedIdx.value);
    }
  } else if (event.key === "Backspace") {
    if (!props.translateMode) {
      event.preventDefault();
      handleBackspace(inputEl, currentFocusedIdx.value);
    }
  } else if (event.key === ".") {
    emit("sentence-end");
  } else if (event.key === "?") {
    emit("sentence-end");
  } else if (event.key === "Suggest") {
    emit("suggest");
  }

  // For virtual events, insert regular characters manually
  if (
    isVirtual &&
    event.key.length === 1 &&
    ![" ", "Backspace", "Tab"].includes(event.key)
  ) {
    const start = inputEl.selectionStart || 0;
    const end = inputEl.selectionEnd || 0;
    const value = inputEl.value;
    inputEl.value = value.slice(0, start) + event.key + value.slice(end);
    inputEl.selectionStart = inputEl.selectionEnd = start + event.key.length;
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    inputEl.focus();
  }
};

const handleDeleteWord = (idx: number) => {
  words.value.splice(idx, 1);
  // Focus the previous word at end, or first if none
  nextTick(() => {
    const focusIdx = idx > 0 ? idx - 1 : 0;
    focusOnEnd(focusIdx);
  });
};

const handleApplyCorrection = (idx: number) => {
  if (words.value[idx].correction) {
    words.value[idx].text = words.value[idx].correction;
    words.value[idx].correction = null;
    words.value[idx].translation = null;
    words.value[idx].status = "idle";
    emit("process-word", {
      id: words.value[idx].id,
      fullText: words.value.map((w) => w.text).join(" "),
    });
    // Move cursor to the end of the corrected word
    nextTick(() => {
      focusOnEnd(idx);
    });
  }
};

const handleApplySentenceCorrection = () => {
  const wrongWords = words.value.filter((w) => w.sentenceError);
  if (wrongWords.length > 0) {
    const correction = wrongWords[0].sentenceError!.correction;
    const correctionWords = correction
      .split(" ")
      .filter((word) => word.trim() !== "");
    const startIdx = words.value.indexOf(wrongWords[0]);
    words.value.splice(
      startIdx,
      wrongWords.length,
      ...correctionWords.map((word) => ({
        text: word,
        id: generateRandomId(),
        correction: null,
        translation: null,
        status: "idle",
        sentenceError: null,
      }))
    );
    // Process all new words
    const fullText = words.value.map((w) => w.text).join(" ");
    for (let i = startIdx; i < startIdx + correctionWords.length; i++) {
      emit("process-word", { id: words.value[i].id, fullText });
    }
    // Focus on the last affected word
    nextTick(() => {
      focusOnEnd(startIdx + correctionWords.length - 1);
    });
  }
};

const handleBreakWord = ({
  idx,
  cursorPos,
}: {
  idx: number;
  cursorPos: number;
}) => {
  const word = words.value[idx];
  const before = word.text.slice(0, cursorPos);
  const after = word.text.slice(cursorPos);
  word.text = before;
  word.status = "idle";
  word.correction = null;
  word.translation = null;
  word.sentenceError = null;
  words.value.splice(idx + 1, 0, {
    text: after,
    id: generateRandomId(),
    correction: null,
    translation: null,
    status: "idle",
    sentenceError: null,
  });
  // Process both words from the split
  const fullText = words.value.map((w) => w.text).join(" ");
  emit("process-word", { id: word.id, fullText });
  emit("process-word", { id: words.value[idx + 1].id, fullText });
  // Focus the new input at beginning
  nextTick(() => {
    focusOn(idx + 1);
  });
};

const handleMergeWords = (idx: number) => {
  if (idx === 0 || !words.value[idx] || !words.value[idx - 1]) return;
  const currentText = words.value[idx].text;
  const prevLen = words.value[idx - 1].text.length;
  words.value[idx - 1].text += currentText;
  words.value.splice(idx, 1);
  words.value[idx - 1].status = "idle";
  words.value[idx - 1].correction = null;
  words.value[idx - 1].translation = null;
  words.value[idx - 1].sentenceError = null;
  // Process the merged word
  emit("process-word", {
    id: words.value[idx - 1].id,
    fullText: words.value.map((w) => w.text).join(" "),
  });
  // Focus the merged input at the merge point
  nextTick(() => {
    focusOnPosition(idx - 1, prevLen, prevLen);
  });
};

async function handleTab() {
  emit("tab", currentFocusedIdx.value);
}

const focusTranslateInput = () => {
  if (translateInputRef.value) {
    translateInputRef.value.focus();
    translateInputRef.value.setSelectionRange(
      0,
      translateInputRef.value.value.length
    );
  }
};

const focusOnEndById = (id: string) => {
  const idx = words.value.findIndex((w) => w.id === id);
  if (idx !== -1) {
    focusOnEnd(idx);
  }
};

const handleMouseEnter = (idx: number) => {
  hoveredIdx.value = idx;
  tooltipRefs.value[idx]?.adjustPosition();
};

const handleMouseLeave = (idx: number) => {
  hoveredIdx.value = null;
};

const handleTooltipClose = () => {
  hoveredIdx.value = null;
  touchActivatedIdx.value = null;
};

const handleWordClick = (idx: number) => {
  // For touch devices, show tooltip on click
  touchActivatedIdx.value = touchActivatedIdx.value === idx ? null : idx;
  if (touchActivatedIdx.value === idx) {
    nextTick(() => {
      tooltipRefs.value[idx]?.adjustPosition();
    });
  }
};

defineExpose({
  focusTranslateInput,
  focusOnEnd,
  focusOnPosition,
  focusOnEndById,
  handleKeyDown,
  getHoveredWordPosition,
  hoveredIdx,
});
</script>
