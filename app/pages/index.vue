<template>
  <BaseLayout>
    <template #header>
      <LanguageSelector @languageChange="handleLanguageChange" />
    </template>

    <template #content>
      <div class="flex relative items-center h-full">
        <div class="mx-auto text-2xl">
          <ModularInput
            ref="modularInputRef"
            :words="words"
            :translateMode="translateMode"
            :isTranslating="isTranslating"
            :wordsToTranslate="wordsToTranslate"
            @input-created="handleInputCreated"
            @process-current="handleProcessCurrent"
            @delete-word="handleDeleteWord"
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
      />
    </template>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
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

const modularInputRef = ref();

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
  // Focus will be handled by ModularInput
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
      // TODO: perhaps update the words with corrections
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
