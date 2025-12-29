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
            :is-checking-sentence="isCheckingSentence"
            @update:wordsToTranslate="
              translateComp.state.value.wordsToTranslate = $event
            "
            @process-word="handleProcessWord"
            @cancel-processing="handleCancelProcessing"
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
        @on-key-press="handleVirtualKeyPress"
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

const modularInputRef = ref();

const translateStartedOnEmpty = ref(false);

const {
  words,
  processWord,
  cancelWordProcessing,
  hasText,
  clearWords,
  isCheckingSentence,
  checkSentence,
} = useWords();
const translateComp = useTranslateMode();

function handleVirtualKeyPress(key: string) {
  modularInputRef.value?.handleKeyDown(new KeyboardEvent("keydown", { key }));
}

function handleLanguageChange(newLanguages: any) {
  languages.value = newLanguages;
}

async function handleTab(idx: number) {
  if (!translateComp.state.value.translateMode) {
    translateStartedOnEmpty.value = words.value[idx]?.text.trim() === "";
    await translateComp.actions.toggleTranslateMode(modularInputRef);
  } else {
    if (translateComp.state.value.wordsToTranslate.trim()) {
      const lastWordId = await translateComp.actions.translateAndInsert(
        idx,
        words,
        processWord,
        languages.value,
        translateStartedOnEmpty.value
      );
      if (lastWordId) {
        await nextTick();
        modularInputRef.value.focusOnEndById(lastWordId);
      }
    }
    translateComp.state.value.translateMode = false;
    translateStartedOnEmpty.value = false;
  }
}

function handleProcessWord(data: { id: string; fullText: string }) {
  if (!data.fullText.trim()) return;
  processWord(data.id, data.fullText);
}

function handleCancelProcessing(id: string) {
  cancelWordProcessing(id);
}

function handleTypingTimeout(data: { id: string; fullText: string }) {
  if (!data.fullText.trim()) return;
  processWord(data.id, data.fullText);
}

function handleCheckSentence() {
  checkSentence();
}
</script>
