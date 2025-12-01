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
            @input-created="handleInputCreated"
            @process-current="handleProcessCurrent"
            @delete-word="handleDeleteWord"
            @check-sentence="handleCheckSentence"
          />
        </div>
      </div>
    </template>

    <template #keyboard>
      <CustomKeyboard
        :is-translating="translateModeState.isTranslating"
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

const { state: translateModeState } = useTranslateMode();

function handleKeyPress(key: string) {
  // Handle virtual keyboard key presses
  console.log("Key pressed:", key);
  const activeElement = document.activeElement as HTMLInputElement;
  if (activeElement && activeElement.tagName === "INPUT") {
    if (key === " " || key.length > 1) {
      // Special key (space or multi-char like Backspace): dispatch keydown event for ModularInput to handle
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
