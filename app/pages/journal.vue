<template>
  <BaseLayout>
    <template #header>
      <div class="flex gap-4 flex-col justify-between items-center w-full">
        <!-- Progress Bar -->
        <div class="flex items-center w-full mx-4">
          <!-- Language Indicator -->
          <div class="px-2 py-1 flex items-center gap-2 text-gray-600 mr-4">
            <span class="text-lg">{{ languageFlag }}</span>
            <span class="text-sm hidden md:inline"
              >Learning {{ targetLanguage.name }}</span
            >
          </div>
          <div class="flex-1 mr-4">
            <ProgressBar :current="wordCount" :goal="wordGoal" height="h-3" />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 whitespace-nowrap"
              >{{ wordCount }}/{{ wordGoal }} {{ $t("words") }}</span
            >
            <button
              @click="isHelpModalOpen = true"
              class="cursor-pointer px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center"
              title="Help"
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>
        <div class="flex justify-between items-center w-full">
          <div class="flex items-center gap-4">
            <button
              @click="navigateBack"
              :disabled="isNavigatingBack"
              class="cursor-pointer px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 text-gray-700 disabled:text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              :title="$t('backToHome')"
            >
              <svg
                v-if="isNavigatingBack"
                class="w-4 h-4 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
              <svg
                v-else
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
                >{{ isNavigatingBack ? $t("saving") : $t("back") }}</span
              >
            </button>
          </div>

          <div class="flex gap-2">
            <button
              v-if="hasText"
              @click="handleClearWords"
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
              @click="toggleVocabulary"
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
              :disabled="isCompleting"
              class="cursor-pointer px-4 py-2 bg-green-100 hover:bg-green-200 disabled:bg-green-100 text-green-700 disabled:text-green-700 rounded-lg transition-colors flex items-center gap-2 font-medium"
              :title="$t('completeYourJournalEntry')"
            >
              <svg
                v-if="isCompleting"
                class="w-4 h-4 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
              <svg
                v-else
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
              <span class="text-sm hidden md:inline">{{
                isCompleting ? $t("completing") : $t("complete")
              }}</span>
            </button>
          </div>
        </div>
      </div>
    </template>

    <template #content>
      <div class="relative h-full p-4">
        <div
          v-if="loading"
          class="absolute inset-0 flex items-center justify-center"
        >
          <div class="text-center">
            <svg
              class="w-8 h-8 animate-spin mx-auto text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path>
            </svg>
            <p class="mt-2 text-gray-600">Loading journal...</p>
          </div>
        </div>
        <div v-else class="absolute inset-0 flex items-center justify-center">
          <div
            class="w-full max-w-4xl text-center text-2xl max-h-96 overflow-y-auto pt-8"
          >
            <ModularInput
              ref="modularInputRef"
              v-model:words="words"
              :translateMode="translateComp.state.value.translateMode"
              :isTranslating="translateComp.state.value.isTranslating"
              :wordsToTranslate="translateComp.state.value.wordsToTranslate"
              :is-checking-sentence="isCheckingSentence"
              :targetLanguage="targetLanguage"
              @update:wordsToTranslate="
                translateComp.state.value.wordsToTranslate = $event
              "
              @process-word="handleProcessWord"
              @cancel-processing="handleCancelProcessing"
              @tab="handleTab"
              @sentence-end="handleCheckSentence"
              @suggest="handleSuggest"
              @focus-changed="currentFocusIdx = $event"
              @typing-timeout="handleTypingTimeout"
              @delete-word="handleDeleteWord"
            />
          </div>
        </div>
      </div>
    </template>

    <template #keyboard>
      <div class="p-4">
        <div class="mx-auto max-w-4xl text-center">
          <div class="inline-flex items-center px-4 py-2 min-h-10">
            <div
              v-if="currentSentenceTranslation || isTranslatingSentence"
              class="flex items-center bg-gray-100 rounded-full px-3 py-1"
            >
              <div
                class="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 mr-2 shrink-0"
              >
                <Icon name="heroicons:language" class="w-3 h-3 text-gray-600" />
              </div>
              <span class="text-lg text-gray-700 leading-tight">
                {{ currentSentenceTranslation }}
                <span
                  v-if="isTranslatingSentence || isGeneratingSuggestion"
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
        :is-generating-suggestion="isGeneratingSuggestion"
        @on-key-press="handleVirtualKeyPress"
      />
    </template>
  </BaseLayout>

  <VocabularySidebar :is-open="isVocabularyOpen" @close="closeVocabulary" />

  <!-- Tab indicator for translate mode - positioned in screen corner -->
  <div
    v-if="words.length > 0 && !isKeyboardVisible"
    class="fixed bottom-4 left-4 z-50"
  >
    <button
      :class="[
        'flex items-center rounded-lg px-3 py-2 transition-colors bg-transparent border border-dashed',
        translateComp.state.value.translateMode
          ? 'text-purple-600 hover:text-purple-700 border-purple-300'
          : 'text-gray-600 hover:text-gray-700 border-gray-300',
      ]"
    >
      <span class="text-sm font-normal">
        <template v-if="!translateComp.state.value.translateMode">
          Press
          <kbd
            class="px-1.5 py-0.5 text-xs font-semibold bg-gray-200 rounded mx-1"
            >Tab</kbd
          >
          to enter
          <span
            :class="
              translateComp.state.value.translateMode
                ? 'text-purple-600 font-bold'
                : 'font-bold'
            "
            >translate mode</span
          >
        </template>
        <template v-else-if="translateComp.state.value.wordsToTranslate.trim()">
          Press
          <kbd
            class="px-1.5 py-0.5 text-xs font-semibold bg-purple-200 rounded mx-1"
            >Tab</kbd
          >
          to <span class="text-purple-600 font-bold">translate</span>
        </template>
        <template v-else>
          Press
          <kbd
            class="px-1.5 py-0.5 text-xs font-semibold bg-purple-200 rounded mx-1"
            >Tab</kbd
          >
          to exit <span class="text-purple-600 font-bold">translate mode</span>
        </template>
      </span>
    </button>
  </div>

  <!-- Generate suggestion button - positioned in screen corner -->
  <div
    v-if="
      words.length > 0 &&
      !translateComp.state.value.translateMode &&
      !isKeyboardVisible
    "
    class="fixed bottom-4 right-4 z-50"
  >
    <button
      @click="handleSuggest"
      :disabled="isGeneratingSuggestion"
      class="flex items-center bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg px-3 py-2 transition-colors border border-yellow-200 disabled:opacity-50"
    >
      <template v-if="isGeneratingSuggestion">
        <svg
          class="h-4 w-4 mr-2 shrink-0 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </template>
      <template v-else>
        <svg
          class="h-4 w-4 mr-2 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          ></path>
        </svg>
      </template>
      <span class="text-sm font-medium">
        <template v-if="isGeneratingSuggestion"> Generating... </template>
        <template v-else> Generate suggestion </template>
      </span>
    </button>
  </div>

  <Modal
    :is-open="isHelpModalOpen"
    title="How to Use"
    @close="isHelpModalOpen = false"
  >
    <div class="space-y-4">
      <!-- Translate Mode Section -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center mb-3">
          <div
            class="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mr-3"
          >
            <svg
              class="w-4 h-4 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              ></path>
            </svg>
          </div>
          <h4 class="font-semibold text-gray-900 text-lg">Translate Mode</h4>
        </div>
        <p class="text-gray-700 text-sm leading-relaxed">
          Press the
          <kbd
            class="px-1.5 py-0.5 text-xs font-semibold bg-gray-200 text-gray-800 rounded shadow-sm"
            >Tab</kbd
          >
          key to enter translate mode, then type words in your native language
          and press
          <kbd
            class="px-1.5 py-0.5 text-xs font-semibold bg-gray-200 text-gray-800 rounded"
            >Tab</kbd
          >
          again to translate and insert them.
        </p>
      </div>

      <!-- Generate Suggestions Section -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center mb-3">
          <div
            class="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full mr-3"
          >
            <svg
              class="w-4 h-4 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              ></path>
            </svg>
          </div>
          <h4 class="font-semibold text-gray-900 text-lg">
            Generate Suggestions
          </h4>
        </div>
        <p class="text-gray-700 text-sm mb-3 leading-relaxed">
          Use the "Generate suggestion" button in the bottom-right corner or the
          keyboard button.
        </p>
        <div class="space-y-2">
          <div class="flex items-start">
            <div
              class="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"
            ></div>
            <p class="text-gray-700 text-sm">
              Click when you need help completing a sentence
            </p>
          </div>
          <div class="flex items-start">
            <div
              class="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"
            ></div>
            <p class="text-gray-700 text-sm">
              If you're in an empty word, it will replace that word with the
              suggestion
            </p>
          </div>
          <div class="flex items-start">
            <div
              class="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"
            ></div>
            <p class="text-gray-700 text-sm">
              Otherwise, it adds the suggestion at the end of your text
            </p>
          </div>
        </div>
      </div>

      <!-- Other Features Section -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center mb-3">
          <div
            class="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mr-3"
          >
            <svg
              class="w-4 h-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
          </div>
          <h4 class="font-semibold text-gray-900 text-lg">Other Features</h4>
        </div>
        <div class="grid grid-cols-1 gap-2">
          <div class="flex items-start">
            <div
              class="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"
            ></div>
            <p class="text-gray-700 text-sm">
              Hover over words to see translations and corrections
            </p>
          </div>
          <div class="flex items-start">
            <div
              class="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"
            ></div>
            <p class="text-gray-700 text-sm">
              Use the virtual keyboard on mobile devices
            </p>
          </div>
          <div class="flex items-start">
            <div
              class="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"
            ></div>
            <p class="text-gray-700 text-sm">
              Check your vocabulary progress in the sidebar
            </p>
          </div>
        </div>
      </div>

      <!-- Pro Tip -->
      <div class="bg-blue-50 rounded-lg p-4">
        <div class="flex items-center mb-3">
          <div
            class="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mr-3"
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              ></path>
            </svg>
          </div>
          <h4 class="font-semibold text-blue-900 text-lg">Pro Tip</h4>
        </div>
        <p class="text-blue-700 text-sm leading-relaxed">
          Start with simple sentences and gradually introduce more vocabulary.
          Don't worry if you don't know a word or need to translate it
          again—with time, it will stick!
        </p>
      </div>
    </div>
  </Modal>

  <VocabularySidebar :is-open="isVocabularyOpen" @close="closeVocabulary" />
</template>

<script setup lang="ts">
import {
  ref,
  nextTick,
  onMounted,
  computed,
  watch,
  onBeforeUnmount,
} from "vue";
import { useCookie, useRoute, navigateTo } from "#app";
import { onBeforeRouteLeave } from "vue-router";
import ModularInput from "~/components/ModularInput.vue";
import CustomKeyboard from "~/components/CustomKeyboard.vue";
import BaseLayout from "~/layouts/BaseLayout.vue";
import VocabularySidebar from "~/components/VocabularySidebar.vue";
import ProgressBar from "~/components/ProgressBar.vue";
import Modal from "~/components/Modal.vue";
import { generateRandomId } from "~/utils/misc";
import { useWords } from "~/composables/useWords";
import { useTranslateMode } from "~/composables/useTranslateMode";
import { useEntries } from "~/composables/useEntries";
import { FirestoreRepository } from "~/repositories/FirestoreRepository";
import { useVocabulary } from "~/composables/useVocabulary";
import type { Word } from "~/types";
import { useSettings } from "~/composables/useSettings";

definePageMeta({
  layout: "base-layout",
});

const { sourceLanguage, targetLanguage } = useSettings();

const languages = computed(() => ({
  source: sourceLanguage.value.id,
  target: targetLanguage.value.id,
}));

const languageFlag = computed(() => {
  const flagMap: Record<string, string> = {
    en: "🇺🇸",
    es: "🇪🇸",
    fr: "🇫🇷",
    de: "🇩🇪",
    it: "🇮🇹",
    pt: "🇵🇹",
    zh: "🇨🇳",
    ja: "🇯🇵",
    ko: "🇰🇷",
    ru: "🇷🇺",
    ar: "🇸🇦",
    hi: "🇮🇳",
    da: "🇩🇰",
  };
  return flagMap[targetLanguage.value.id] || "🌍";
});

const isKeyboardVisible = ref(false);

const updateKeyboardVisibility = () => {
  if (process.client) {
    isKeyboardVisible.value = window.innerWidth < 768;
  }
};

onMounted(() => {
  updateKeyboardVisibility();
  window.addEventListener("resize", updateKeyboardVisibility);
});

onBeforeUnmount(() => {
  if (process.client) {
    window.removeEventListener("resize", updateKeyboardVisibility);
  }
});

const modularInputRef = ref();

const { wordGoal } = useSettings();

const currentFocusIdx = ref(-1);

const isVocabularyOpen = ref(false);

const isHelpModalOpen = ref(false);

const translateStartedOnEmpty = ref(false);

const currentSentenceTranslation = ref("");

const isTranslatingSentence = ref(false);

const translationController = ref<AbortController | null>(null);

const translationTimeout = ref<NodeJS.Timeout | null>(null);

const isGeneratingSuggestion = ref(false);

const loading = ref(true);

const isCompleting = ref(false);

const isNavigatingBack = ref(false);

const route = useRoute();
const entryId = computed(() => route.query.id as string);

const {
  words,
  processWord,
  cancelWordProcessing,
  hasText,
  clearWords,
  isCheckingSentence,
  checkSentence,
} = useWords(entryId.value);
const translateComp = useTranslateMode();

const {
  entries,
  saveEntry: saveEntryToFirestore,
  loadEntry: loadEntryFromFirestore,
  createJournalEntry,
  updateEntry,
} = useEntries();

const firebaseRepo = new FirestoreRepository("journal_entries");
const {
  newWordsCount,
  clearNewWordsCount,
  saveVocabularyToFirestore,
  loadVocabularyFromFirestore,
  vocabulary,
} = useVocabulary();

const today = computed(() => {
  const route = useRoute();
  if (route.query.date) {
    return route.query.date as string;
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});

const fullText = computed(() => words.value.map((w) => w.text).join(" "));
const currentSentence = computed(() => {
  const wordList = words.value;
  if (wordList.length === 0) return "";
  const idx =
    currentFocusIdx.value >= 0 ? currentFocusIdx.value : wordList.length - 1;
  if (idx < 0) return "";
  // Find the sentence containing the focused word
  let start = idx;
  // Go back to find the start of the sentence (after a dot, question mark, or exclamation mark)
  while (start > 0) {
    const prevWord = wordList[start - 1];
    if (
      !prevWord ||
      prevWord.text == null ||
      prevWord.text.endsWith(".") ||
      prevWord.text.endsWith("?") ||
      prevWord.text.endsWith("!")
    ) {
      break;
    }
    start--;
  }
  let end = idx;
  // Go forward to find the end of the sentence (before a dot, question mark, or exclamation mark, but include up to the punctuation)
  while (end < wordList.length - 1) {
    const currentWord = wordList[end];
    if (
      !currentWord ||
      currentWord.text == null ||
      currentWord.text.endsWith(".") ||
      currentWord.text.endsWith("?") ||
      currentWord.text.endsWith("!")
    ) {
      break;
    }
    end++;
  }
  // Include the dot, question mark, or exclamation mark if present
  if (end < wordList.length - 1) {
    const nextWord = wordList[end + 1];
    if (
      nextWord &&
      nextWord.text != null &&
      (nextWord.text === "." || nextWord.text === "?" || nextWord.text === "!")
    ) {
      end++;
    }
  }
  const sentenceWords = wordList.slice(start, end + 1);
  return sentenceWords
    .map((w) => w.text)
    .join(" ")
    .trim();
});

const wordCount = computed(
  () => fullText.value.split(" ").filter((w) => w.trim()).length
);

watch(currentSentence, (newSentence) => {
  if (newSentence === "") {
    currentSentenceTranslation.value = "";
    return;
  }
});

const isProcessing = computed(
  () =>
    isTranslatingSentence.value ||
    translateComp.state.value.isTranslating ||
    isCheckingSentence.value ||
    words.value.some((word) => word.status === "pending")
);

async function saveEntry() {
  const route = useRoute();
  const entryId = route.query.id as string;
  if (!entryId || entryId === "undefined") return;

  try {
    // Get createdAt from local state, fallback to current time for new entries
    const localEntry = entries.value.find((e) => e.id === entryId);
    const createdAt = localEntry?.createdAt || new Date().toISOString();

    const entry = {
      text: fullText.value,
      wordCount: wordCount.value,
      words: words.value,
      language: targetLanguage.value.id,
      createdAt,
      updatedAt: new Date().toISOString(),
    };
    // Remove undefined fields
    const cleanEntry = JSON.parse(JSON.stringify(entry));
    await saveEntryToFirestore(entryId, cleanEntry);
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

  // Cancel previous translation if ongoing
  if (translationController.value) {
    translationController.value.abort();
  }

  // Create new controller for this request
  translationController.value = new AbortController();

  isTranslatingSentence.value = true;
  try {
    const response = await $fetch("/api/translate", {
      method: "POST",
      body: {
        sentence: sentence,
        source: languages.value.target,
        target: languages.value.source,
      },
      signal: translationController.value.signal,
    });
    currentSentenceTranslation.value = response.translation;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("Translation aborted");
      // Request was cancelled, do nothing
      return;
    }
    console.error("Translation error:", error);
    // Keep previous translation on error
  } finally {
    isTranslatingSentence.value = false;
    translationController.value = null;
  }
}

async function loadEntry() {
  const route = useRoute();
  const entryId = route.query.id as string;

  if (entryId) {
    const entry = await loadEntryFromFirestore(entryId);
    if (entry) {
      // Load words if the entry has them
      if (entry.words && entry.words.length > 0) {
        words.value = entry.words;
      }
      // If entry.words is empty, words are already cleared
    } else {
      // Entry not found: Create new entry (words are already cleared)
      await createJournalEntry(entryId);
    }
  } else {
    await navigateTo("/");
  }
  loading.value = false;

  // Auto-focus the input after loading
  await nextTick();
  if (modularInputRef.value && words.value.length > 0) {
    modularInputRef.value.focusOnEnd(words.value.length - 1);
    currentFocusIdx.value = words.value.length - 1;
  }
}

onMounted(async () => {
  await loadEntry();

  // Load vocabulary if not already loaded
  await loadVocabularyFromFirestore();
});

onBeforeRouteLeave(async () => {
  if (!isProcessing.value) {
    saveEntry();
  } else {
    while (isProcessing.value) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    saveEntry();
  }

  // Save vocabulary to Firestore before leaving
  try {
    saveVocabularyToFirestore();
  } catch (error) {
    console.error("Error saving vocabulary:", error);
  }
});

// Update entry in state when words change
watch(
  words,
  () => {
    const route = useRoute();
    const entryId = route.query.id as string;
    if (entryId) {
      updateEntry(entryId, {
        text: fullText.value,
        wordCount: wordCount.value,
        words: words.value,
      });
    }
  },
  { deep: true }
);

function handleVirtualKeyPress(key: string) {
  modularInputRef.value?.handleKeyDown(new KeyboardEvent("keydown", { key }));
}

async function handleTab(idx: number) {
  // Check if user is currently focused in an input field
  const activeElement = document.activeElement;
  const isFocusedInInput = activeElement && activeElement.tagName === "INPUT";

  // If not focused in an input, focus on the last word
  if (!isFocusedInInput && words.value.length > 0) {
    await nextTick();
    modularInputRef.value?.focusOn(words.value.length - 1);
    currentFocusIdx.value = words.value.length - 1;
    return;
  }

  // Otherwise, proceed with translate mode logic
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
        modularInputRef.value?.focusOnEndById(lastWordId);
      }
      translateCurrentSentence();
    } else {
      translateComp.state.value.translateMode = false;
      await nextTick();
      if (words.value[idx]) {
        modularInputRef.value?.focusOnEndById(words.value[idx].id);
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
  translateCurrentSentence();
}

function handleCheckSentence() {
  checkSentence();
}

async function handleSuggest() {
  if (words.value.length === 0) return;

  isGeneratingSuggestion.value = true;

  // Check if the current word is empty - we'll replace it with the suggestion
  const currentIdx = currentFocusIdx.value;
  const isCurrentWordEmpty =
    currentIdx >= 0 &&
    currentIdx < words.value.length &&
    words.value[currentIdx].text.trim() === "";

  // Add a temporary "generating" word at the position where we'll insert the suggestion
  const insertIdx = isCurrentWordEmpty ? currentIdx : words.value.length;
  const tempWord: Word = {
    id: generateRandomId(),
    text: $t("generatingSuggestion"),
    status: "idle",
    correction: null,
    translation: null,
  };

  if (isCurrentWordEmpty) {
    // Replace the empty word with the temp word
    words.value.splice(currentIdx, 1, tempWord);
  } else {
    // Add the temp word at the end
    words.value.push(tempWord);
  }

  const currentText = words.value
    .slice(0, -1)
    .map((w) => w.text)
    .join(" "); // Exclude the temp word

  try {
    const response = await $fetch("/api/suggest", {
      method: "POST",
      body: {
        text: currentText,
        target: languages.value.target,
      },
    });
    let completion = response.completion?.trim();
    if (completion && completion.trim()) {
      // If the completion includes the current text, remove it
      if (completion.startsWith(currentText)) {
        completion = completion.substring(currentText.length).trim();
      }
      // Remove the temporary word
      words.value.splice(insertIdx, 1);

      // Split the completion into words and add them
      const newWords = completion
        .trim()
        .split(" ")
        .filter((word: string) => word.trim() !== "");
      if (newWords.length > 0) {
        // The API now handles capitalization properly, so no need to capitalize here
        // Collect all new words first, then add them in one operation to minimize reactive updates
        const wordsToAdd = newWords.map((wordText: string) => ({
          id: generateRandomId(),
          text: wordText,
          status: "idle", // Mark as idle so they get processed normally
          correction: null,
          translation: null,
        }));
        // Insert the new words at the position where the temp word was
        words.value.splice(insertIdx, 0, ...wordsToAdd);
        // Focus on the last added word by ID to avoid index/ref issues
        const lastWordId = wordsToAdd[wordsToAdd.length - 1].id;
        modularInputRef.value?.focusOnEndById(lastWordId);
        // Process the new words
        const fullText = words.value.map((w) => w.text).join(" ");
        for (let i = insertIdx; i < insertIdx + wordsToAdd.length; i++) {
          if (words.value[i]) {
            processWord(words.value[i]!.id, fullText);
          }
        }
      }
    } else {
      // No completion, remove temp word
      words.value.splice(insertIdx, 1);
    }
  } catch (error) {
    console.error("Error getting suggestion:", error);
    // Remove temp word on error
    words.value.splice(insertIdx, 1);
  } finally {
    isGeneratingSuggestion.value = false;
  }
  // Wait for focus to update and then translate the current sentence
  await nextTick();
  translateCurrentSentence();
}

function handleMouseEnter(idx: number) {
  // Handle mouse enter for tooltips or other interactions
}

function handleMouseLeave(idx: number) {
  // Handle mouse leave for tooltips or other interactions
}

function handleDeleteWord(idx: number) {
  words.value.splice(idx, 1);
}

function handleClearWords() {
  clearWords();
  nextTick(() => {
    if (modularInputRef.value) {
      modularInputRef.value.focusOnEnd(0);
    }
  });
}

function toggleVocabulary() {
  isVocabularyOpen.value = !isVocabularyOpen.value;
  if (isVocabularyOpen.value) {
    clearNewWordsCount();
  }
}

function closeVocabulary() {
  isVocabularyOpen.value = false;
}

function completeEntry() {
  if (isProcessing.value) {
    isCompleting.value = true;
  }
  // The entry is already saved automatically via the watch on fullText/wordCount
  // Navigate back to home page
  navigateTo("/?completed=true");
}

function navigateBack() {
  if (isProcessing.value) {
    isNavigatingBack.value = true;
  }
  navigateTo("/");
}
</script>
