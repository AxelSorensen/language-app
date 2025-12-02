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
            v-model:words="words"
            :translateMode="translateComp.state.value.translateMode"
            :isTranslating="translateComp.state.value.isTranslating"
            :wordsToTranslate="translateComp.state.value.wordsToTranslate"
            :is-checking-sentence="isCheckingSentenceLocal"
            @update:wordsToTranslate="
              translateComp.state.value.wordsToTranslate = $event
            "
            @process-word="handleProcessWord"
            @tab="handleTab"
            @dot="handleCheckSentence"
            @typing-timeout="handleTypingTimeout"
          />
        </div>
      </div>
    </template>

    <template #keyboard>
      <CustomKeyboard
        :is-translating="translateComp.state.value.isTranslating"
        :translate-mode="translateComp.state.value.translateMode"
        :words-to-translate="translateComp.state.value.wordsToTranslate"
        @on-key-press="
          (key) => {
            modularInputRef.value?.focusCurrent();
            modularInputRef.value?.handleKeyPress(key, true);
          }
        "
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
import { useWords } from "~/composables/useWords";
import { useTranslateMode } from "~/composables/useTranslateMode";

definePageMeta({
  layout: "keyboard",
});

const languages = ref({
  source: "en",
  target: "es",
});

function handleBlurTranslate() {
  translateComp.state.value.translateMode = false;
}

const { words, processWord } = useWords();
const translateComp = useTranslateMode();

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

const isCheckingSentenceLocal = ref(false);

function handleTab(prevSel) {
  if (!translateComp.state.value.translateMode) {
    // Enter translate mode and save selection
    previousSelection.value = prevSel;
    handleToggleTranslateMode();
  } else {
    // If there are words to translate, process them
    if (translateComp.state.value.wordsToTranslate.trim()) {
      handleTranslate();
    }
    // Always exit translate mode and select the last word of the current index
    translateComp.state.value.translateMode = false;
    if (previousSelection.value) {
      nextTick(() => {
        modularInputRef.value.focusOnEnd(previousSelection.value.idx);
      });
      previousSelection.value = null;
    }
  }
}

function handleProcessWord(data: { id: string; fullText: string }) {
  processWord(data.id, data.fullText);
}

function handleTypingTimeout(data: { id: string; fullText: string }) {
  // Example: process the word after typing inactivity
  processWord(data.id, data.fullText);
}

async function handleCheckSentence() {
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
  isCheckingSentenceLocal.value = false;
}

async function handleToggleTranslateMode() {
  translateComp.state.value.translateMode =
    !translateComp.state.value.translateMode;
  if (translateComp.state.value.translateMode) {
    await nextTick();
    modularInputRef.value.focusTranslateInput();
    return;
  }
}

async function handleTranslate() {
  if (!translateComp.state.value.wordsToTranslate) {
    return;
  }

  translateComp.state.value.isTranslating = true;

  // Filter out empty words from the text to translate
  const filteredText = translateComp.state.value.wordsToTranslate
    .split(" ")
    .filter((word) => word.trim() !== "")
    .join(" ");

  const response = await $fetch("/api/translate", {
    method: "POST",
    body: {
      text: filteredText,
      source: languages.value.source,
      target: languages.value.target,
    },
  });
  console.log("Translation response:", response);

  translateComp.state.value.isTranslating = false;

  const translatedText = response.translation;
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

    let emptyBefore = words.value
      .slice(0, insertIdx)
      .filter((w) => w.text.trim() === "").length;
    words.value = words.value.filter((w) => w.text.trim() !== "");
    let newInsertIdx = insertIdx - emptyBefore;
    // Focus on the last added word at the end
    await nextTick();
    modularInputRef.value.focusOnEnd(newInsertIdx + newWords.length - 1);
    // Process the new translated words
    const fullText = words.value.map((w) => w.text).join(" ");
    for (let i = newInsertIdx; i < newInsertIdx + newWords.length; i++) {
      processWord(words.value[i].id, fullText);
    }

    // Remove empty words

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
  }

  // After translating, exit translate mode
  translateComp.state.value.translateMode = false;

  // Clear the translate input
  translateComp.state.value.wordsToTranslate = "";

  // Do not restore previous selection after translation, stay at the last added word
}
</script>
