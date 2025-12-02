<template>
  <div
    class="flex flex-wrap max-w-[800px]"
    :class="{ 'animate-pulse': props.isCheckingSentence }"
  >
    {{ words }}
    <div
      v-for="(word, idx) in words || []"
      :key="word.id"
      class="relative group"
    >
      <input
        v-if="word.text !== '' || (!props.translateMode && !isTranslating)"
        autofocus
        inputmode="none"
        :ref="(el) => setInputRef(idx, el as HTMLInputElement)"
        v-model="word.text"
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
      />
      <input
        v-if="
          ((props.translateMode || props.isTranslating) &&
            idx === currentFocusedIdx) ||
          words?.length === 0
        "
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
            ? handleApplyCorrection(idx)
            : word.sentenceError
            ? handleApplySentenceCorrection()
            : undefined
        "
        @deleteWord="handleDeleteWord(idx)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, nextTick } from "vue";
import SimpleTooltip from "~/components/SimpleTooltip.vue";
import { useState } from "#app";

interface Word {
  text: string;
  id: string;
  correction: string | null;
  translation: string | null;
  status: "idle" | "pending";
  sentenceError: any;
}

interface Props {
  translateMode?: boolean;
  isTranslating?: boolean;
  wordsToTranslate?: string;
  isCheckingSentence?: boolean;
}

const props = withDefaults(defineProps<Props>(), {});

const words = defineModel<Word[]>("words");

const emit = defineEmits<{
  "update:wordsToTranslate": [value: string];
  "blur-translate": [];
  tab: [previousSelection: { idx: number; start: number; end: number } | null];
  space: [data: { id: string; fullText: string }];
  dot: [];
  "process-word": [data: { id: string; fullText: string }];
  "check-sentence": [];
}>();

const translateInputRef = ref<HTMLInputElement>();

const currentFocusedIdx = ref(0);

const inputsRefs = ref<HTMLInputElement[]>([]);
const setInputRef = (idx: number, el: HTMLInputElement | null) => {
  if (el) inputsRefs.value[idx] = el;
};

const lastSelection = ref<{ idx: number; start: number; end: number } | null>(
  null
);

watch(
  () => props.translateMode,
  (newMode, oldMode) => {
    if (oldMode && !newMode && lastSelection.value) {
      // Translate mode turned off, restore focus
      nextTick(() => {
        focusOnPosition(
          lastSelection.value!.idx,
          lastSelection.value!.start,
          lastSelection.value!.end
        );
      });
    } else if (!oldMode && newMode) {
      // Translate mode turned on, save current selection
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
  // Set status to idle on input
  words.value[idx].status = "idle";
  // Manage typing timeout - removed processing here, now done on space/dot
};

const handleSpace = (inputEl: HTMLInputElement, idx: number) => {
  if (props.translateMode) return; // Do not create new words in translate mode

  const word = words.value[idx];
  if (word.text.trim() === "") return; // Prevent space in empty words

  const cursorPos = inputEl.selectionStart || 0;
  const wordLength = word.text.length;

  if (cursorPos === 0) {
    // At the beginning, just add new word before
    words.value.splice(idx, 0, {
      text: "",
      id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
    if (inputEl) {
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
  const inputEl = event.target as HTMLInputElement;
  const cursorPos = inputEl.selectionStart || 0;
  const wordLength = words.value[currentFocusedIdx.value].text.length;
  if (event.key === "Tab") {
    event.preventDefault();
    handleTab();
  } else if (event.key === "ArrowLeft") {
    if (cursorPos === 0 && currentFocusedIdx.value > 0) {
      event.preventDefault();
      focusOnEnd(currentFocusedIdx.value - 1);
    }
  } else if (event.key === "ArrowRight") {
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
    emit("dot");
  }
};

const handleKeyPress = (key: string, isVirtual = false) => {
  // Handle virtual keyboard key presses
  console.log("Key pressed:", key);
  if (props.translateMode && key === "Backspace") {
    const activeElement = document.activeElement as HTMLInputElement;
    if (activeElement && activeElement !== translateInputRef.value) {
      return true; // Prevent backspace on main inputs in translate mode
    }
  }
  if (key === "Tab") {
    handleTab();
    return true;
  }
  if (key === ".") {
    // Insert the dot manually
    const activeElement = document.activeElement as HTMLInputElement;
    if (activeElement && activeElement.tagName === "INPUT") {
      const start = activeElement.selectionStart || 0;
      const end = activeElement.selectionEnd || 0;
      const value = activeElement.value;
      activeElement.value = value.slice(0, start) + key + value.slice(end);
      activeElement.selectionStart = activeElement.selectionEnd =
        start + key.length;
      activeElement.dispatchEvent(new Event("input", { bubbles: true }));
      activeElement.focus();
    }
    emit("check-sentence");
    return true;
  }
  const targetElement = isVirtual
    ? inputsRefs.value[currentFocusedIdx.value]
    : (document.activeElement as HTMLInputElement);
  if (targetElement && targetElement.tagName === "INPUT") {
    if (key === " ") {
      // Handle space specially for ModularInput
      const idx = inputsRefs.value.findIndex((el) => el === targetElement);
      if (idx !== -1 && idx !== undefined) {
        handleSpace(targetElement, idx);
        return true;
      }
    } else if (key === "Backspace") {
      // Handle backspace specially for ModularInput or normal delete
      const idx = inputsRefs.value.findIndex((el) => el === targetElement);
      if (idx !== -1 && idx !== undefined) {
        handleBackspace(targetElement, idx);
        return true;
      } else {
        // Normal backspace for other inputs (e.g., translateInput)
        const start = targetElement.selectionStart || 0;
        const end = targetElement.selectionEnd || 0;
        if (start !== end) {
          // Delete selection
          targetElement.value =
            targetElement.value.slice(0, start) +
            targetElement.value.slice(end);
          targetElement.selectionStart = targetElement.selectionEnd = start;
        } else if (start > 0) {
          // Delete previous character
          targetElement.value =
            targetElement.value.slice(0, start - 1) +
            targetElement.value.slice(start);
          targetElement.selectionStart = targetElement.selectionEnd = start - 1;
        }
        targetElement.dispatchEvent(new Event("input", { bubbles: true }));
        return true; // Prevent default browser behavior
      }
    } else if (key.length > 1) {
      // Other special keys: dispatch keydown event for ModularInput to handle
      const event = new KeyboardEvent("keydown", { key });
      targetElement.dispatchEvent(event);
    } else if (isVirtual) {
      // Regular character from virtual keyboard: insert directly
      const start = targetElement.selectionStart || 0;
      const end = targetElement.selectionEnd || 0;
      const value = targetElement.value;
      targetElement.value = value.slice(0, start) + key + value.slice(end);
      targetElement.selectionStart = targetElement.selectionEnd =
        start + key.length;
      targetElement.dispatchEvent(new Event("input", { bubbles: true }));
      targetElement.focus();
    }
    // For physical keyboard regular characters, let browser handle
  }
  return false;
};

const keydownHandler = (event: KeyboardEvent) => {
  if (event.key === "Tab") {
    event.preventDefault();
    console.log("Tab key pressed");
    handleTab();
    return;
  }
  if (
    (event.key === " " || event.key === "Backspace") &&
    !props.translateMode
  ) {
    event.preventDefault();
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
});

const handleInputCreated = (idx: number) => {
  if (words.value[idx].status === "idle") {
    processWord(words.value[idx].id, words.value.map((w) => w.text).join(" "));
  }
};

const handleProcessCurrent = (id: string) => {
  const idx = words.value.findIndex((w) => w.id === id);
  if (idx !== -1 && words.value[idx].status === "idle") {
    processWord(id, words.value.map((w) => w.text).join(" "));
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
        id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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

const handleCheckSentence = async () => {
  isCheckingSentenceLocal.value = true;
  const fullText = words.value.map((w) => w.text).join(" ");
  if (fullText.trim()) {
    try {
      const result = await $fetch("/api/check-sentence", {
        method: "POST",
        body: { sentence: fullText },
      });
      console.log("Sentence correction:", result);
      // Clear previous sentence errors
      words.value.forEach((w) => (w.sentenceError = null));
      if (result.type === "correction") {
        const startIdx = fullText.indexOf(result.wrong_text);
        if (startIdx !== -1) {
          const endIdx = startIdx + result.wrong_text.length;
          let currentIdx = 0;
          for (let i = 0; i < words.value.length; i++) {
            const wordStart = currentIdx;
            const wordEnd = currentIdx + words.value[i].text.length;
            if (wordEnd > startIdx && wordStart < endIdx) {
              words.value[i].sentenceError = {
                correction: result.correction,
                explanation: result.explanation,
              };
            }
            currentIdx += words.value[i].text.length + 1; // +1 for space
          }
        }
      }
    } catch (error) {
      console.error("Sentence check failed:", error);
    }
  }
};

async function handleTab() {
  let prevSel: { idx: number; start: number; end: number } | null = null;
  if (!props.translateMode) {
    // Save current selection before entering translate mode
    const activeElement = document.activeElement as HTMLInputElement;
    if (activeElement && activeElement.tagName === "INPUT") {
      const idx = inputsRefs.value.findIndex((el) => el === activeElement);
      if (idx !== -1 && idx !== undefined) {
        prevSel = {
          idx,
          start: activeElement.selectionStart || 0,
          end: activeElement.selectionEnd || 0,
        };
        lastSelection.value = prevSel; // Save for later restoration
      }
    }
  }
  emit("tab", prevSel);
}

async function handleTranslate() {
  emit("translate");
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

defineExpose({ focusTranslateInput, focusOnEnd, focusOnPosition });
</script>
