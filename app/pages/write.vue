<template>
  <BaseLayout>
    <template #header>
      <div class="flex gap-4 flex-col justify-between items-center w-full">
        <!-- Progress Bar -->
        <div class="flex items-center w-full mx-4">
          <div class="flex-1 mr-4">
            <ProgressBar :current="wordCount" :goal="wordGoal" height="h-3" />
          </div>
          <span class="text-sm text-gray-600 whitespace-nowrap"
            >{{ wordCount }}/{{ wordGoal }} {{ $t("words") }}</span
          >
        </div>
        <div class="flex justify-between items-center w-full">
          <div class="flex items-center gap-4">
            <button
              @click="navigateTo('/')"
              class="cursor-pointer px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              :title="$t('backToHome')"
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
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
              <span
                class="text-sm font-medium text-gray-700 hidden md:inline"
                >{{ $t("back") }}</span
              >
            </button>
          </div>

          <div class="flex gap-2">
            <button
              v-if="hasText"
              @click="clearWords"
              class="cursor-pointer px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              :title="$t('clearAllText')"
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
              <span
                class="text-sm font-medium text-gray-700 hidden md:inline"
                >{{ $t("clear") }}</span
              >
            </button>

            <button
              @click="toggleDictionary"
              class="cursor-pointer px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-2 relative"
              title="{{ $t('openVocabulary') }}"
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
              <span
                class="text-sm font-medium text-blue-700 hidden md:inline"
                >{{ $t("vocabulary") }}</span
              >
              <span
                v-if="newWordsCount > 0"
                class="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce z-10"
              >
                {{ newWordsCount > 9 ? "9+" : newWordsCount }}
              </span>
            </button>

            <button
              v-if="wordCount >= wordGoal"
              @click="completeEntry"
              class="cursor-pointer px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors flex items-center gap-2 font-medium"
              title="{{ $t('completeYourJournalEntry') }}"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              <span class="text-sm hidden md:inline">{{ $t("complete") }}</span>
            </button>
          </div>
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
            @apply-correction="handleApplyCorrection"
            @delete-word="handleDeleteWord"
          />
        </div>
      </div>
    </template>

    <template #keyboard>
      <div class="p-4">
        <div class="mx-auto max-w-4xl text-center">
          <div class="inline-flex items-center px-4 py-2 min-h-[2.5rem]">
            <div
              v-if="
                currentSentence &&
                (currentSentenceTranslation || isTranslatingSentence)
              "
              class="flex items-center bg-gray-100 rounded-full px-3 py-1"
            >
              <div
                class="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 mr-2 flex-shrink-0"
              >
                <Icon name="heroicons:language" class="w-3 h-3 text-gray-600" />
              </div>
              <span class="text-lg text-gray-700 leading-tight">
                {{ currentSentenceTranslation }}
                <span
                  v-if="isTranslatingSentence"
                  class="inline-flex items-baseline ml-1"
                >
                  <span
                    class="text-xl font-bold animate-pulse leading-none text-purple-600"
                    >.</span
                  >
                  <span
                    class="text-xl font-bold animate-pulse leading-none text-purple-600"
                    >.</span
                  >
                  <span
                    class="text-xl font-bold animate-pulse leading-none text-purple-600"
                    >.</span
                  >
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <CustomKeyboard
        class="md:hidden"
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
import { ref, nextTick, onMounted, computed, watch } from "vue";
import { useCookie, useRoute, navigateTo } from "#app";
import { onBeforeRouteLeave } from "vue-router";
import ModularInput from "~/components/ModularInput.vue";
import CustomKeyboard from "~/components/CustomKeyboard.vue";
import BaseLayout from "~/layouts/BaseLayout.vue";
import DictionarySidebar from "~/components/DictionarySidebar.vue";
import ProgressBar from "~/components/ProgressBar.vue";
import { WORD_GOAL } from "~/constants";
import { useWords } from "~/composables/useWords";
import { useTranslateMode } from "~/composables/useTranslateMode";
import { useEntries } from "~/composables/useEntries";
import { FirestoreRepository } from "~/repositories/FirestoreRepository";
import { useDictionary } from "~/composables/useDictionary";
import { useSettings } from "~/composables/useSettings";

definePageMeta({
  layout: "keyboard",
});

const { sourceLanguage, targetLanguage } = useSettings();

const languages = computed(() => ({
  source: sourceLanguage.value.id,
  target: targetLanguage.value.id,
}));

const modularInputRef = ref();

const { wordGoal } = useSettings();

const isDictionaryOpen = ref(false);

const translateStartedOnEmpty = ref(false);

const currentEntryId = ref<string | null>(null);

const currentSentenceTranslation = ref("");

const isTranslatingSentence = ref(false);

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

const {
  entries,
  saveEntry: saveEntryToFirestore,
  loadEntry: loadEntryFromFirestore,
  createJournalEntry,
} = useEntries();

const firebaseRepo = new FirestoreRepository("journal_entries");
const { newWordsCount, clearNewWordsCount } = useDictionary();

const today = computed(() => {
  const route = useRoute();
  return (route.query.date as string) || new Date().toISOString().split("T")[0];
});

const fullText = computed(() => words.value.map((w) => w.text).join(" "));
const currentSentence = computed(() => {
  const text = fullText.value;
  const sentences = text.split(".");
  return sentences[sentences.length - 1].trim();
});
const wordCount = computed(
  () => fullText.value.split(" ").filter((w) => w.trim()).length
);

const isProcessing = computed(
  () =>
    isTranslatingSentence.value ||
    translateComp.state.value.isTranslating ||
    isCheckingSentence.value ||
    words.value.some((word) => word.status === "pending")
);

async function saveEntry() {
  if (!currentEntryId.value) return;

  try {
    await saveEntryToFirestore(currentEntryId.value, {
      date: today.value,
      text: fullText.value,
      wordCount: wordCount.value,
      words: words.value,
    });
  } catch (error) {
    console.error("Failed to save entry to Firestore:", error);
  }
}

async function translateCurrentSentence() {
  const sentence = currentSentence.value;
  if (!sentence.trim()) {
    currentSentenceTranslation.value = "";
    return;
  }
  isTranslatingSentence.value = true;
  try {
    const response = await $fetch("/api/translate", {
      method: "POST",
      body: {
        sentence: sentence,
        source: languages.value.target,
        target: languages.value.source,
      },
    });
    currentSentenceTranslation.value = response.translation;
  } catch (error) {
    console.error("Translation error:", error);
    currentSentenceTranslation.value = "";
  } finally {
    isTranslatingSentence.value = false;
  }
}

async function loadEntry() {
  const route = useRoute();
  const entryId = route.query.id as string;

  if (entryId) {
    const entry = await loadEntryFromFirestore(entryId);
    if (entry) {
      currentEntryId.value = entryId;
      words.value = entry.words;
    } else {
      // Entry not found: Create new entry
      await createJournalEntry(entryId);
      currentEntryId.value = entryId;
    }
  } else {
    await navigateTo("/");
  }
}

onMounted(async () => {
  await loadEntry();
});

onBeforeRouteLeave(async () => {
  while (isProcessing.value) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await saveEntry();
});

watch(
  [fullText, wordCount],
  async () => {
    await saveEntry();
  },
  { deep: true }
);

function handleVirtualKeyPress(key: string) {
  modularInputRef.value?.handleKeyDown(new KeyboardEvent("keydown", { key }));
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
      translateCurrentSentence();
    } else {
      translateComp.state.value.translateMode = false;
      await nextTick();
      modularInputRef.value.focusOnEndById(words.value[idx].id);
    }
    // Ensure translate mode exits after translation
    // translateComp.state.value.translateMode = false; // Now done in translateAndInsert
    translateStartedOnEmpty.value = false;
  }
}

function handleProcessWord(data: { id: string; fullText: string }) {
  translateCurrentSentence();
  if (!data.fullText.trim()) return;
  processWord(data.id, data.fullText);
}

function handleCancelProcessing(id: string) {
  cancelWordProcessing(id);
}

function handleTypingTimeout(data: { id: string; fullText: string }) {
  if (!data.fullText.trim()) return;
  processWord(data.id, data.fullText);
  translateCurrentSentence();
}

function handleCheckSentence() {
  checkSentence();
}

function handleMouseEnter(idx: number) {
  // Handle mouse enter for tooltips or other interactions
}

function handleMouseLeave(idx: number) {
  // Handle mouse leave for tooltips or other interactions
}

function handleApplyCorrection(data: { idx: number; correction: string }) {
  if (words.value[data.idx]) {
    words.value[data.idx].text = data.correction;
    words.value[data.idx].correction = null; // Clear the correction
  }
}

function handleDeleteWord(idx: number) {
  words.value.splice(idx, 1);
}

function toggleDictionary() {
  isDictionaryOpen.value = !isDictionaryOpen.value;
  if (isDictionaryOpen.value) {
    clearNewWordsCount();
  }
}

function closeDictionary() {
  isDictionaryOpen.value = false;
}

function completeEntry() {
  // The entry is already saved automatically via the watch on fullText/wordCount
  // Navigate back to home page
  navigateTo("/");
}
</script>
