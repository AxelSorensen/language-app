<template>
  <div class="max-w-4xl mx-auto p-4">
    <h1
      class="text-3xl font-bold text-center mb-6 font-['Inter'] text-gray-800"
    >
      pol<span class="text-blue-500">i</span
      ><span class="text-orange-500">i</span>go
    </h1>
    <div class="flex justify-between items-center mb-4">
      <LanguageSelector @languageChange="handleLanguageChange" />
      <div class="flex items-center">
        <div
          class="flex items-center bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-orange-700"
        >
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span class="text-sm font-semibold">{{ streak }}</span>
        </div>
        <button
          @click="showSettingsModal = true"
          class="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="{{ $t('settings') }}"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </div>

    <div
      v-if="!todayEntry || todayEntry.wordCount < wordGoal"
      class="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-blue-900">
          {{ $t("todaysJournal") }}
        </h2>
        <div class="text-sm text-blue-600">
          {{ todayEntry?.wordCount || 0 }}/{{ wordGoal }} {{ $t("words") }}
        </div>
      </div>
      <div class="w-full overflow-hidden bg-blue-200 rounded-full h-3 mb-4">
        <ProgressBar
          :current="todayEntry?.wordCount || 0"
          :goal="wordGoal"
          height="h-3"
        />
      </div>
      <p class="text-blue-800 mb-4">
        {{
          todayEntry
            ? $t("writtenWords", {
                count: todayEntry.wordCount,
                goal: wordGoal,
              })
            : $t("notStarted")
        }}
      </p>
      <button
        @click="startJournal"
        :disabled="!loaded"
        class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors shadow-sm"
      >
        <svg
          class="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          ></path>
        </svg>
        {{ todayEntry ? $t("continueWriting") : $t("startTodaysJournal") }}
      </button>
    </div>

    <div v-else class="mb-6 p-6 rounded-xl">
      <div class="text-center">
        <svg
          class="w-12 h-12 text-green-600 mx-auto mb-4"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          ></path>
        </svg>
        <h3 class="text-xl font-semibold text-gray-900">
          {{ $t("allDone") }}
        </h3>
        <p class="text-gray-700 mt-2">
          {{ $t("completedEntry") }}
        </p>
      </div>
    </div>

    <!-- Previous Entries -->
    <h2 class="text-lg font-medium mb-4 text-gray-900">
      {{ $t("previousEntries") }}
    </h2>
    <div v-if="previousEntries && previousEntries.length > 0" class="mb-6">
      <div class="space-y-4">
        <div
          v-for="entry in previousEntries || []"
          :key="entry.createdAt"
          class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow relative"
        >
          <div class="absolute top-4 right-4 flex gap-2">
            <button
              @click="editEntry(entry)"
              class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              :title="$t('editEntry')"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                ></path>
              </svg>
            </button>
            <button
              @click="handleDeleteEntry(entry)"
              class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              :title="$t('deleteEntry')"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                ></path>
              </svg>
            </button>
          </div>
          <div class="flex items-start justify-between mb-3 pr-12">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                {{ formatDate(entry.createdAt) }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ entry.wordCount }} {{ $t("words") }}
              </p>
            </div>
          </div>
          <p class="text-gray-700 leading-relaxed">
            {{
              entry.text && entry.text.length > 200
                ? entry.text.substring(0, 200) + "..."
                : entry.text || ""
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- No Previous Entries -->
    <div v-else>
      <div
        v-if="todayEntry && todayEntry.wordCount >= wordGoal"
        class="space-y-4"
      >
        <div
          class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                {{ formatDate(todayEntry.createdAt) }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ todayEntry.wordCount }} {{ $t("words") }}
              </p>
            </div>
            <div class="flex items-center">
              <div class="flex items-center text-green-600">
                <svg
                  class="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span class="text-sm font-medium">{{ $t("complete") }}</span>
              </div>
            </div>
          </div>
          <p class="text-gray-700 leading-relaxed">
            {{
              todayEntry.text && todayEntry.text.length > 200
                ? todayEntry.text.substring(0, 200) + "..."
                : todayEntry.text || ""
            }}
          </p>
        </div>
      </div>
      <div v-else class="text-center py-12">
        <svg
          class="w-16 h-16 text-gray-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ $t("noPreviousEntries") }}
        </h3>
        <p class="text-gray-500">
          {{ $t("startFirstEntry") }}
        </p>
      </div>
    </div>

    <!-- Settings Modal -->
    <SettingsModal
      :is-open="showSettingsModal"
      @close="showSettingsModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useCookie } from "#app";
import LanguageSelector from "~/components/LanguageSelector.vue";
import ProgressBar from "~/components/ProgressBar.vue";
import SettingsModal from "~/components/SettingsModal.vue";
import { WORD_GOAL } from "~/constants";
import { useEntries } from "~/composables/useEntries";
import { useSettings } from "~/composables/useSettings";
import { navigateTo } from "#app";

interface DiaryEntry {
  id: string;
  text: string;
  wordCount: number;
  createdAt: string;
  updatedAt?: string;
}

const { entries, getAllEntries, createJournalEntry, deleteEntry } =
  useEntries();

const { wordGoal, sourceLanguage, targetLanguage } = useSettings();

const { setLocale, locale } = useI18n();

// Watch for changes to source language and update locale
watch(sourceLanguage, (newSource) => {
  setLocale(newSource.id === "es" ? "es" : "en");
});

const showSettingsModal = ref(false);

const loaded = ref(false);

const languageOptions = [
  { id: "en", name: "English" },
  { id: "es", name: "Spanish" },
  { id: "da", name: "Danish" },
  { id: "fr", name: "French" },
  { id: "de", name: "German" },
  { id: "it", name: "Italian" },
  { id: "pt", name: "Portuguese" },
  { id: "zh", name: "Chinese" },
  { id: "ja", name: "Japanese" },
  { id: "ko", name: "Korean" },
  { id: "ru", name: "Russian" },
  { id: "ar", name: "Arabic" },
];

const languages = computed(() => ({
  source: sourceLanguage.value.id,
  target: targetLanguage.value.id,
}));

const today = computed(() => {
  const now = new Date();
  return now.toISOString().split("T")[0];
});

const todayEntry = computed(
  () =>
    entries.value.find(
      (e) =>
        e.createdAt &&
        !isNaN(new Date(e.createdAt).getTime()) &&
        new Date(e.createdAt).toISOString().split("T")[0] === today.value
    ) || null
);

const previousEntries = computed(() => {
  return entries.value
    .filter((entry) => {
      const entryDate = entry.createdAt
        ? new Date(entry.createdAt).toISOString().split("T")[0]
        : null;
      console.log(
        "entry:",
        entry,
        "entryDate:",
        entryDate,
        "today:",
        today.value,
        "wordCount:",
        entry.wordCount,
        "goal:",
        wordGoal.value
      );
      if (entryDate === today.value) {
        return entry.wordCount >= wordGoal.value;
      } else {
        return entry.wordCount > 0;
      }
    })
    .sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
});

// Load all entries on mount
onMounted(async () => {
  entries.value = await getAllEntries();
  loaded.value = true;
});
const streak = computed(() => {
  const completedDates = entries.value
    .filter(
      (entry) =>
        entry.createdAt &&
        !isNaN(new Date(entry.createdAt).getTime()) &&
        entry.wordCount >= wordGoal
    )
    .map((entry) => new Date(entry.createdAt).toISOString().split("T")[0])
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  if (completedDates.length === 0) return 0;
  let streakCount = 1;
  let currentDate = new Date(completedDates[0]);
  for (let i = 1; i < completedDates.length; i++) {
    currentDate.setDate(currentDate.getDate() - 1);
    const expectedDate = currentDate.toISOString().split("T")[0];
    if (completedDates[i] === expectedDate) {
      streakCount++;
    } else {
      break;
    }
  }
  return streakCount;
});
function formatDate(date: string | undefined): string {
  if (!date) return "No date";
  return new Date(date).toLocaleDateString(locale.value, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function editEntry(entry: DiaryEntry) {
  navigateTo(`/journal?id=${entry.id}`);
}

async function handleDeleteEntry(entry: DiaryEntry) {
  try {
    await deleteEntry(entry.id);
  } catch (error) {
    console.error("Error deleting entry:", error);
    alert($t("deleteError"));
  }
}

function handleLanguageChange(newLanguages: {
  source: string;
  target: string;
}) {
  // Update the settings
  sourceLanguage.value =
    languageOptions.find((lang) => lang.id === newLanguages.source) ||
    languageOptions[0];
  targetLanguage.value =
    languageOptions.find((lang) => lang.id === newLanguages.target) ||
    languageOptions[1];

  // Locale will be automatically updated by the watcher on sourceLanguage
}

async function startJournal() {
  try {
    if (todayEntry.value) {
      // Today's entry exists, navigate to it
      await navigateTo(`/journal?id=${todayEntry.value.id}`);
    } else {
      // Create new entry
      const randomId = crypto.randomUUID();
      await navigateTo(`/journal?id=${randomId}`);
    }
  } catch (error) {
    console.error("Error starting journal:", error);
  }
}
</script>
