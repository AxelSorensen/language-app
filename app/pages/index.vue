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
      <div class="flex relative items-center h-full">
        <div class="mx-auto text-2xl">
          <ModularInput
            ref="modularInputRef"
            :key="wordsKey"
            :words="words"
            :translateMode="translateMode"
            :isTranslating="isTranslating"
            :wordsToTranslate="wordsToTranslate"
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
          />
        </div>
      </div>
    </template>

    <template #keyboard>
      <CustomKeyboard
        :is-translating="isTranslating"
        @on-key-press="handleKeyPress"
        @keyboard-click="focusInput"
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

const previousSelection = ref<{
  idx: number;
  start: number;
  end: number;
} | null>(null);

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
  words.value[idx].text = "";
  words.value[idx].correction = null;
  words.value[idx].translation = null;
  words.value[idx].status = "empty";
  words.value[idx].sentenceError = null;
  // Handle focus
  nextTick(() => {
    modularInputRef.value.focusOnEnd(idx);
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
    const correctionWords = correction.split(" ");
    if (correctionWords.length === wrongWords.length) {
      wrongWords.forEach((w, i) => {
        w.text = correctionWords[i];
        w.sentenceError = null;
        w.translation = null;
        w.status = "idle";
        processWord(w.id, words.value.map((w) => w.text).join(" "));
      });
      // Focus on the last corrected word
      nextTick(() => {
        const lastIdx = words.value.indexOf(wrongWords[wrongWords.length - 1]);
        modularInputRef.value.focusOnEnd(lastIdx);
      });
    }
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
  // Process the merged word
  processWord(
    words.value[idx - 1].id,
    words.value.map((w) => w.text).join(" ")
  );
  // Focus the merged input at the merge point
  nextTick(() => {
    modularInputRef.value.focusOnPosition(
      idx - 1,
      words.value[idx - 1].text.length - currentText.length
    );
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
      if (result.wrong_text) {
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

  const response = await translateModeComp.actions.translate(
    translateModeComp.state.value.wordsToTranslate
  );
  console.log("Translation response:", response);

  const translatedText = response.translation;
  const newWords = translatedText
    .split(" ")
    .filter((word) => word.trim() !== "");
  if (newWords.length > 0) {
    for (const word of newWords) {
      words.value.push({
        id: crypto.randomUUID(),
        text: word,
        status: "idle",
        correction: null,
        translation: null,
      });
    }
    // Focus on the last added word at the end
    await nextTick();
    modularInputRef.value.focusOnEnd(words.value.length - 1);
    // Process the new translated words
    const fullText = words.value.map((w) => w.text).join(" ");
    for (
      let i = words.value.length - newWords.length;
      i < words.value.length;
      i++
    ) {
      processWord(words.value[i].id, fullText);
    }
  }
}

function handleKeyPress(key: string) {
  // Handle virtual keyboard key presses
  console.log("Key pressed:", key);
  if (key === "Tab") {
    handleTab();
    return;
  }
  const activeElement = document.activeElement as HTMLInputElement;
  if (activeElement && activeElement.tagName === "INPUT") {
    if (key === " ") {
      // Handle space specially for ModularInput
      const idx = modularInputRef.value?.inputsRefs.findIndex(
        (el) => el === activeElement
      );
      if (idx !== -1 && idx !== undefined) {
        modularInputRef.value.handleSpace(activeElement, idx);
      }
    } else if (key === "Backspace") {
      // Handle backspace specially for ModularInput or normal delete
      const idx = modularInputRef.value?.inputsRefs.findIndex(
        (el) => el === activeElement
      );
      if (idx !== -1 && idx !== undefined) {
        modularInputRef.value.handleBackspace(activeElement, idx);
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
    } else {
      // Regular character: insert directly
      const start = activeElement.selectionStart || 0;
      const end = activeElement.selectionEnd || 0;
      const value = activeElement.value;
      activeElement.value = value.slice(0, start) + key + value.slice(end);
      activeElement.selectionStart = activeElement.selectionEnd =
        start + key.length;
      activeElement.dispatchEvent(new Event("input", { bubbles: true }));
      activeElement.focus();
    }
  }
}
</script>
