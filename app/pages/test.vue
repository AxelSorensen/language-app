<template>
  <BaseLayout>
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
  </BaseLayout>
</template>

<script setup lang="ts">
import { nextTick } from "vue";
import { useWords } from "~/composables/useWords";
import BaseLayout from "~/layouts/BaseLayout.vue";
import { LanguageService } from "~/services/LanguageService";

const modularInputRef = ref();

const { words, processWord } = useWords();

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
  nextTick(() => {
    modularInputRef.value?.focusOn(idx);
  });
};

const handleCheckSentence = async () => {
  const fullText = words.value.map((w) => w.text).join(" ");
  if (fullText.trim()) {
    try {
      const result = await LanguageService.checkSentence(fullText, "es"); // assuming Spanish, or get from settings
      console.log("Sentence correction:", result);
      // TODO: perhaps update the words with corrections
    } catch (error) {
      console.error("Sentence check failed:", error);
    }
  }
};
</script>
