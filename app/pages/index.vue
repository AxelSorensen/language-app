<template>
  <BaseLayout>
    <template #header>
      <LanguageSelector @languageChange="handleLanguageChange" />

      <button
        v-if="hasText"
        @click="clearWords"
        class="fixed top-4 right-4 cursor-pointer px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors z-50 flex items-center gap-2"
        title="Clear all text"
      >
        <svg
          class="w-4 h-4 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
        <span class="text-sm font-medium text-gray-700">Clear</span>
      </button>
    </template>

    <template #content>
      <div class="flex relative items-center p-4 h-full">
        <div class="mx-auto text-2xl">
          <ModularInput
            ref="modularInputRef"
            :key="wordsKey"
            :words="words"
            :translateMode="translateMode"
            :isTranslating="isTranslating"
            :wordsToTranslate="wordsToTranslate"
            :isCheckingSentence="isCheckingSentence"
            @input-created="handleInputCreated"
            @process-current="handleProcessCurrent"
            @delete-word="handleDeleteWord"
            @apply-correction="handleApplyCorrection"
            @apply-sentence-correction="handleApplySentenceCorrection"
            @break-word="handleBreakWord"
            @merge-words="handleMergeWords"
            @add-word-after="handleAddWordAfter"
            @check-sentence="handleCheckSentence"
            @update:wordsToTranslate="wordsToTranslate = $event"
            @blur-translate="
              translateModeComp.state.value.translateMode = false
            "
          />
        </div>
      </div>
    </template>

    <template #keyboard>
      <CustomKeyboard
        :is-translating="isTranslating"
        @on-key-press="(key) => handleKeyPress(key, true)"
      />
    </template>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import ModularInput from "~/components/ModularInput.vue";
import LanguageSelector from "~/components/LanguageSelector.vue";
import CustomKeyboard from "~/components/CustomKeyboard.vue";
import BaseLayout from "~/layouts/BaseLayout.vue";
import { useTranslateMode } from "~/composables/useTranslateMode";
import { useWords } from "~/composables/useWords";

definePageMeta({
  layout: "keyboard",
});

const languages = ref({
  source: "en",
  target: "es",
});

const { words, processWord } = useWords();

const wordsKey = ref(0);

const hasText = computed(() => words.value.some((w) => w.text.trim() !== ""));

const clearWords = () => {
  words.value = [
    {
      text: "",
      id: crypto.randomUUID(),
      correction: null,
      translation: null,
      status: "idle",
      sentenceError: null,
    },
  ];
  wordsKey.value++;
  nextTick(() => {
    modularInputRef.value?.focusOnPosition(0, 0);
  });
};

const focusInput = () => {
  modularInputRef.value?.focusCurrent();
};

if (words.value.length === 0) {
  words.value.push({
    text: "",
    id: crypto.randomUUID(),
    correction: null,
    translation: null,
    status: "idle",
    sentenceError: null,
  });
}

const modularInputRef = ref();

const isCheckingSentence = ref(false);

const previousSelection = ref<{
  idx: number;
  start: number;
  end: number;
} | null>(null);

const handleSpace = (inputEl: HTMLInputElement, idx: number) => {
  if (translateMode.value) return; // Do not create new words in translate mode

  const word = words.value[idx];
  if (word.text.trim() === "") return; // Do not handle space if already in an empty word

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
      modularInputRef.value.focusOnPosition(idx, 0);
    });
  } else if (cursorPos < wordLength) {
    // In the middle, break the word
    handleBreakWord({ idx, cursorPos });
  } else {
    // At the end, process current word and add new
    if (word.text.trim() !== "" && word.status === "idle") {
      processWord(word.id, words.value.map((w) => w.text).join(" "));
    }
    words.value.splice(idx + 1, 0, {
      text: "",
      id: crypto.randomUUID(),
      correction: null,
      translation: null,
      status: "idle",
      sentenceError: null,
    });
    nextTick(() => {
      modularInputRef.value.focusOnPosition(idx + 1, 0);
    });
  }
};

const handleBackspace = (inputEl: HTMLInputElement, idx: number) => {
  const start = inputEl.selectionStart || 0;
  const end = inputEl.selectionEnd || 0;
  if (start === 0 && end === 0) {
    // At start of word
    if (idx > 0) {
      // Merge with previous word
      handleMergeWords(idx);
    } else if (words.value.length > 1 && words.value[idx].text === "") {
      // Delete empty first word if more than one
      words.value.splice(idx, 1);
      nextTick(() => {
        modularInputRef.value.focusOnEnd(0);
      });
    }
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

function handleLanguageChange(newLanguages) {
  languages.value = newLanguages;
}

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
    modularInputRef.value.focusOnEnd(focusIdx);
  });
};

const handleApplyCorrection = (idx: number) => {
  if (words.value[idx].correction) {
    words.value[idx].text = words.value[idx].correction;
    words.value[idx].correction = null;
    words.value[idx].translation = null;
    words.value[idx].status = "idle";
    processWord(words.value[idx].id, words.value.map((w) => w.text).join(" "));
    // Move cursor to the end of the corrected word
    nextTick(() => {
      modularInputRef.value.focusOnEnd(idx);
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
      processWord(words.value[i].id, fullText);
    }
    // Focus on the last affected word
    nextTick(() => {
      modularInputRef.value.focusOnEnd(startIdx + correctionWords.length - 1);
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
  processWord(word.id, words.value.map((w) => w.text).join(" "));
  processWord(
    words.value[idx + 1].id,
    words.value.map((w) => w.text).join(" ")
  );
  // Focus the new input at beginning
  nextTick(() => {
    modularInputRef.value.focusOnPosition(idx + 1, 0);
  });
};

const handleMergeWords = (idx: number) => {
  const currentText = words.value[idx].text;
  words.value[idx - 1].text += currentText;
  words.value.splice(idx, 1);
  words.value[idx - 1].status = "idle";
  words.value[idx - 1].correction = null;
  words.value[idx - 1].translation = null;
  words.value[idx - 1].sentenceError = null;
  // Process the merged word
  processWord(
    words.value[idx - 1].id,
    words.value.map((w) => w.text).join(" ")
  );
  // Focus the merged input at the end
  nextTick(() => {
    modularInputRef.value.focusOnEnd(idx - 1);
  });
};

const handleAddWordAfter = (idx: number) => {
  words.value.splice(idx + 1, 0, {
    text: "",
    id: crypto.randomUUID(),
    correction: null,
    translation: null,
    status: "idle",
    sentenceError: null,
  });
  // Focus the new input at beginning
  nextTick(() => {
    modularInputRef.value.focusOnPosition(idx + 1, 0);
  });
};

const handleCheckSentence = async () => {
  isCheckingSentence.value = true;
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
  isCheckingSentence.value = false;
};

const translateModeComp = useTranslateMode();

const translateMode = computed(
  () => translateModeComp.state.value.translateMode
);
const isTranslating = computed(
  () => translateModeComp.state.value.isTranslating
);
const wordsToTranslate = computed({
  get: () => translateModeComp.state.value.wordsToTranslate,
  set: (value) => (translateModeComp.state.value.wordsToTranslate = value),
});

async function handleTab() {
  if (!translateModeComp.state.value.translateMode) {
    // Save current selection before entering translate mode
    const activeElement = document.activeElement as HTMLInputElement;
    if (activeElement && activeElement.tagName === "INPUT") {
      const idx = modularInputRef.value?.inputsRefs.findIndex(
        (el) => el === activeElement
      );
      if (idx !== -1 && idx !== undefined) {
        previousSelection.value = {
          idx,
          start: activeElement.selectionStart || 0,
          end: activeElement.selectionEnd || 0,
        };
      }
    }
  }
  translateModeComp.state.value.translateMode =
    !translateModeComp.state.value.translateMode;
  if (translateModeComp.state.value.translateMode) {
    await nextTick();
    if (modularInputRef.value?.translateInputRef) {
      modularInputRef.value.translateInputRef.focus();
      modularInputRef.value.translateInputRef.setSelectionRange(
        0,
        modularInputRef.value.translateInputRef.value.length
      );
    }
    return;
  }

  // Handle translation response and add translated words
  if (!translateModeComp.state.value.wordsToTranslate) {
    // Restore previous selection
    if (previousSelection.value) {
      await nextTick();
      modularInputRef.value.focusOnPosition(
        previousSelection.value.idx,
        previousSelection.value.start,
        previousSelection.value.end
      );
      previousSelection.value = null;
    }
    return;
  }

  // Filter out empty words from the text to translate
  const filteredText = translateModeComp.state.value.wordsToTranslate
    .split(" ")
    .filter((word) => word.trim() !== "")
    .join(" ");

  const response = await translateModeComp.actions.translate(filteredText);
  console.log("Translation response:", response);

  const translatedText = response.translation.trim();
  const newWords = translatedText
    .split(" ")
    .filter((word) => word.trim() !== "");
  if (newWords.length > 0) {
    let insertIdx = words.value.length;
    if (previousSelection.value) {
      insertIdx = previousSelection.value.idx + 1;
      // If the current word is empty, delete it
      if (words.value[previousSelection.value.idx].text.trim() === "") {
        words.value.splice(previousSelection.value.idx, 1);
        insertIdx = previousSelection.value.idx;
      }
    }
    words.value.splice(
      insertIdx,
      0,
      ...newWords.map((word) => ({
        id: crypto.randomUUID(),
        text: word,
        status: "idle",
        correction: null,
        translation: null,
      }))
    );
    // Focus on the last added word at the end
    await nextTick();
    modularInputRef.value.focusOnEnd(insertIdx + newWords.length - 1);
    // Process the new translated words
    const fullText = words.value.map((w) => w.text).join(" ");
    for (let i = insertIdx; i < insertIdx + newWords.length; i++) {
      processWord(words.value[i].id, fullText);
    }
  }
}

function handleKeyPress(key: string, isVirtual = false) {
  // Handle virtual keyboard key presses
  console.log("Key pressed:", key);
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
      activeElement.selectionStart = activeElement.selectionEnd = start + key.length;
      activeElement.dispatchEvent(new Event("input", { bubbles: true }));
      activeElement.focus();
    }
    handleCheckSentence();
    return true;
  }
  const activeElement = document.activeElement as HTMLInputElement;
  if (activeElement && activeElement.tagName === "INPUT") {
    if (key === " ") {
      // Handle space specially for ModularInput
      const idx = modularInputRef.value?.inputsRefs.findIndex(
        (el) => el === activeElement
      );
      if (idx !== -1 && idx !== undefined) {
        handleSpace(activeElement, idx);
        return !isVirtual;
      }
    } else if (key === "Backspace") {
      // Handle backspace specially for ModularInput or normal delete
      const idx = modularInputRef.value?.inputsRefs.findIndex(
        (el) => el === activeElement
      );
      if (idx !== -1 && idx !== undefined) {
        handleBackspace(activeElement, idx);
        return !isVirtual;
      } else {
        // Normal backspace for other inputs (e.g., translateInput)
        const start = activeElement.selectionStart || 0;
        const end = activeElement.selectionEnd || 0;
        if (start !== end) {
          // Delete selection
          activeElement.value =
            activeElement.value.slice(0, start) +
            activeElement.value.slice(end);
          activeElement.selectionStart = activeElement.selectionEnd = start;
        } else if (start > 0) {
          // Delete previous character
          activeElement.value =
            activeElement.value.slice(0, start - 1) +
            activeElement.value.slice(start);
          activeElement.selectionStart = activeElement.selectionEnd = start - 1;
        }
        activeElement.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } else if (key.length > 1) {
      // Other special keys: dispatch keydown event for ModularInput to handle
      const event = new KeyboardEvent("keydown", { key });
      activeElement.dispatchEvent(event);
    } else if (isVirtual) {
      // Regular character from virtual keyboard: insert directly
      const start = activeElement.selectionStart || 0;
      const end = activeElement.selectionEnd || 0;
      const value = activeElement.value;
      activeElement.value = value.slice(0, start) + key + value.slice(end);
      activeElement.selectionStart = activeElement.selectionEnd =
        start + key.length;
      activeElement.dispatchEvent(new Event("input", { bubbles: true }));
      activeElement.focus();
    }
    // For physical keyboard regular characters, let browser handle
  }
  return false;
}

const keydownHandler = (event: KeyboardEvent) => {
  if (handleKeyPress(event.key, false)) {
    event.preventDefault();
  }
};

onMounted(() => {
  document.addEventListener("keydown", keydownHandler);
});

onUnmounted(() => {
  document.removeEventListener("keydown", keydownHandler);
});
</script>
