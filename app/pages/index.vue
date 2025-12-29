<template>
  <BaseLayout>
    <template #header>
      <div class="flex justify-between items-center w-full">
        <LanguageSelector @languageChange="handleLanguageChange" />

        <div class="flex gap-2">
          <button
            v-if="hasText"
            @click="clearWords"
            class="cursor-pointer px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
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
            <span class="text-sm font-medium text-gray-700 hidden md:inline"
              >Clear</span
            >
          </button>

          <button
            @click="toggleDictionary"
            class="cursor-pointer px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-2"
            title="Open vocabulary"
          >
            <svg
              class="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              ></path>
            </svg>
            <span class="text-sm font-medium text-blue-700 hidden md:inline"
              >Vocabulary</span
            >
          </button>
        </div>
      </div>
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

  <DictionarySidebar :is-open="isDictionaryOpen" @close="closeDictionary" />
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import ModularInput from "~/components/ModularInput.vue";
import LanguageSelector from "~/components/LanguageSelector.vue";
import CustomKeyboard from "~/components/CustomKeyboard.vue";
import BaseLayout from "~/layouts/BaseLayout.vue";
import DictionarySidebar from "~/components/DictionarySidebar.vue";
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

const isDictionaryOpen = ref(false);

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
    // Ensure translate mode exits after translation
    // translateComp.state.value.translateMode = false; // Now done in translateAndInsert
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

function toggleDictionary() {
  isDictionaryOpen.value = !isDictionaryOpen.value;
}

function closeDictionary() {
  isDictionaryOpen.value = false;
}
</script>
