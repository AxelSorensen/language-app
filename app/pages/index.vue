<template>
  <div class="max-w-4xl mx-auto p-4 min-h-screen flex flex-col">
    <h1
      class="text-3xl font-bold text-center mb-6 font-['Inter'] text-gray-800"
    >
      pol<span class="text-blue-500">i</span
      ><span class="text-orange-500">i</span>go
    </h1>
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center gap-2">
        <LanguageSelector @languageChange="handleLanguageChange" />
        <span
          v-if="!hasSpellchecker(targetLanguage.id)"
          class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium"
        >
          Beta
        </span>
      </div>
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

    <div v-if="loading" class="animate-pulse">
      <!-- Skeleton for today's journal -->
      <div
        class="mb-6 p-6 bg-gray-100 border border-gray-200 rounded-xl shadow-sm"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="h-6 bg-gray-300 rounded w-48"></div>
          <div class="h-4 bg-gray-300 rounded w-16"></div>
        </div>
        <div class="h-3 bg-gray-300 rounded-full mb-4"></div>
        <div class="h-4 bg-gray-300 rounded mb-4"></div>
        <div class="h-12 bg-gray-300 rounded-lg w-40"></div>
      </div>

      <!-- Skeleton for previous entries -->
      <div class="h-6 bg-gray-300 rounded mb-4 w-40"></div>
      <div class="space-y-4">
        <div
          v-for="i in 3"
          :key="i"
          class="bg-gray-100 border border-gray-200 rounded-lg p-6 shadow-sm"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="h-5 bg-gray-300 rounded mb-1 w-32"></div>
              <div class="h-4 bg-gray-300 rounded w-20"></div>
            </div>
          </div>
          <div class="h-4 bg-gray-300 rounded mb-2"></div>
          <div class="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col">
      <!-- Today's Journal -->
      <div
        v-if="!todayEntry || (todayEntry.wordCount || 0) < wordGoal"
        class="mb-6 p-6 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-blue-900">
            {{ $t("todaysJournal") }} - {{ todayFormatted }}
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
          :disabled="loading"
          class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:animate-pulse text-white font-medium rounded-lg transition-colors shadow-sm"
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

      <div
        v-if="todayEntry && todayEntry.wordCount >= wordGoal"
        class="mb-6 p-6 rounded-xl"
      >
        <div class="text-center">
          <svg
            :class="[
              'w-12 h-12 text-green-600 mx-auto mb-4 checkmark-completed',
              justCompleted ? 'checkmark-spring' : '',
            ]"
            :key="justCompleted ? 'animated' : 'static'"
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

      <!-- Previous Entries Section -->
      <div class="flex-1 flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium text-gray-900">
            {{ showChart ? $t("vocabularyProgress") : $t("previousEntries") }}
          </h2>
          <div class="flex bg-gray-100 rounded-lg p-1">
            <button
              @click="showChart = false"
              :class="[
                'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all duration-200',
                !showChart
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
              ]"
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
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
              <span class="hidden sm:inline">{{ $t("entries") }}</span>
            </button>
            <button
              @click="showChart = true"
              :class="[
                'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all duration-200',
                showChart
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
              ]"
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
                  d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span class="hidden sm:inline">{{
                $t("vocabularyProgress")
              }}</span>
            </button>
          </div>
        </div>

        <div v-if="showChart">
          <VocabularyChart :data="chartData" />
        </div>
        <div v-else>
          <div
            v-if="previousEntries && previousEntries.length > 0"
            class="mb-6"
          >
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
                      {{ entry.wordCount }} {{ $t("words") }} •
                      {{
                        entry.words?.filter(
                          (w) =>
                            w.firstUsed &&
                            w.firstUsed.substring(0, 10) ===
                              entry.createdAt?.substring(0, 10)
                        ).length || 0
                      }}
                      {{ $t("newWordsLearned") }}
                    </p>
                  </div>
                </div>
                <p class="text-gray-700 leading-relaxed line-clamp-1">
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
          <div v-else class="flex-1 flex items-center justify-center">
            <div
              v-if="todayEntry && (todayEntry.wordCount || 0) >= wordGoal"
              class="space-y-4 w-full"
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
                      {{ todayEntry!.wordCount }} {{ $t("words") }} •
                      {{
                        todayEntry!.words?.filter(
                          (w) =>
                            w.firstUsed &&
                            w.firstUsed.substring(0, 10) ===
                              todayEntry!.createdAt?.substring(0, 10)
                        ).length || 0
                      }}
                      {{ $t("newWordsLearned") }}
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
                      <span class="text-sm font-medium">{{
                        $t("complete")
                      }}</span>
                    </div>
                  </div>
                </div>
                <p class="text-gray-700 leading-relaxed line-clamp-1">
                  {{
                    todayEntry.text && todayEntry.text.length > 200
                      ? todayEntry.text.substring(0, 200) + "..."
                      : todayEntry.text || ""
                  }}
                </p>
              </div>
            </div>
            <div v-else class="text-center w-full">
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
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <SettingsModal
      :is-open="showSettingsModal"
      @close="showSettingsModal = false"
    />

    <!-- Delete Confirmation Modal -->
    <Modal
      :is-open="showDeleteModal"
      :title="$t('deleteEntry')"
      @close="cancelDelete"
    >
      <p class="text-gray-700 mb-6">
        {{ $t("deleteConfirmationPrefix") }}
        <strong>{{ formatDate(entryToDelete?.createdAt) }}</strong
        >{{ $t("deleteConfirmationSuffix") }}
      </p>
      <div class="flex justify-end space-x-3">
        <button
          @click="cancelDelete"
          class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          {{ $t("cancel") }}
        </button>
        <button
          @click="confirmDelete"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          {{ $t("delete") }}
        </button>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useCookie } from "#app";
import LanguageSelector from "~/components/LanguageSelector.vue";
import ProgressBar from "~/components/ProgressBar.vue";
import SettingsModal from "~/components/SettingsModal.vue";
import Modal from "~/components/Modal.vue";
import { WORD_GOAL } from "~/constants";
import { useEntries } from "~/composables/useEntries";
import { useSettings } from "~/composables/useSettings";
import { navigateTo, useRoute } from "#app";
import type { Word } from "~/types";
import type { DiaryEntry } from "~/composables/useEntries";
import VocabularyChart from "~/components/VocabularyChart.vue";

const { wordGoal, sourceLanguage, targetLanguage } = useSettings();

const { entries, loading, getAllEntries, createJournalEntry, deleteEntry } =
  useEntries();

const { setLocale, locale } = useI18n();

// Watch for changes to source language and update locale
watch(sourceLanguage, (newSource) => {
  setLocale(newSource.id === "es" ? "es" : "en");
});

const showSettingsModal = ref(false);

const showChart = ref(false);

const route = useRoute();

const justCompleted = ref(false);

const showDeleteModal = ref(false);

const entryToDelete = ref<DiaryEntry | null>(null);

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

function hasSpellchecker(id) {
  const languagesWithSpellchecker = ["en", "es", "da", "de", "fr", "it", "pt"];
  return languagesWithSpellchecker.includes(id);
}

const today = computed(() => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});

const todayFormatted = computed(() => {
  const now = new Date();
  return now.toLocaleDateString(locale.value, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
});

const todayEntry = computed(
  () =>
    entries.value.find(
      (e) =>
        e.createdAt &&
        !isNaN(new Date(e.createdAt).getTime()) &&
        (() => {
          const createdDate = new Date(e.createdAt);
          const year = createdDate.getUTCFullYear();
          const month = String(createdDate.getUTCMonth() + 1).padStart(2, "0");
          const day = String(createdDate.getUTCDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        })() === today.value
    ) || null
);

// Watch for journal completion to trigger vibration

const previousEntries = computed(() => {
  return entries.value
    .filter((entry) => {
      const entryDate = entry.createdAt
        ? (() => {
            const createdDate = new Date(entry.createdAt!);
            const year = createdDate.getUTCFullYear();
            const month = String(createdDate.getUTCMonth() + 1).padStart(
              2,
              "0"
            );
            const day = String(createdDate.getUTCDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
          })()
        : null;
      if (entryDate === today.value) {
        return (entry.wordCount || 0) >= wordGoal.value;
      } else {
        return (entry.wordCount || 0) > 0;
      }
    })
    .sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt!).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt!).getTime() : 0;
      return bDate - aDate;
    });
});

// Load all entries on mount
onMounted(async () => {
  if (entries.value.length === 0) {
    await getAllEntries();
  }
  if (route.query.completed === "true") {
    justCompleted.value = true;
    // Clear the query param
    await navigateTo("/", { replace: true });
  }
});
const chartData = computed(() => {
  const wordMap = new Map<string, number>();
  entries.value.forEach((entry) => {
    entry.words?.forEach((word) => {
      if (word.firstUsed) {
        const date = word.firstUsed.substring(0, 10); // YYYY-MM-DD
        wordMap.set(date, (wordMap.get(date) || 0) + 1);
      }
    });
  });
  const sortedData = Array.from(wordMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Make it cumulative
  let cumulative = 0;
  const cumulativeData = sortedData.map((item) => {
    cumulative += item.count;
    return {
      date: new Date(item.date).toLocaleDateString(locale.value, {
        month: "short",
        day: "numeric",
      }),
      count: cumulative,
    };
  });

  return cumulativeData;
});
const streak = computed(() => {
  const completedDates = entries.value
    .filter(
      (entry) =>
        entry.createdAt &&
        !isNaN(new Date(entry.createdAt).getTime()) &&
        entry.wordCount >= wordGoal.value
    )
    .map((entry) => {
      const createdDate = new Date(entry.createdAt!);
      const year = createdDate.getFullYear();
      const month = String(createdDate.getMonth() + 1).padStart(2, "0");
      const day = String(createdDate.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    })
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (completedDates.length === 0) return 0;

  // Check if today has a completed entry
  const todayStr = today.value;
  if (!completedDates.includes(todayStr)) return 0;

  // Count consecutive days backward from today
  let streakCount = 1;
  let currentDate = new Date(todayStr);

  for (let i = 1; i < completedDates.length; i++) {
    currentDate.setDate(currentDate.getDate() - 1);
    const expectedDate = (() => {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    })();

    if (completedDates.includes(expectedDate)) {
      streakCount++;
    } else {
      break;
    }
  }

  return streakCount;
});
function formatDate(date: string | undefined): string {
  if (!date) return "Date not available";
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return "Invalid date";
    }
    return parsedDate.toLocaleDateString(locale.value, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    return "Date error";
  }
}

function editEntry(entry: DiaryEntry) {
  navigateTo(`/journal?id=${entry.id!}`);
}

async function handleDeleteEntry(entry: DiaryEntry) {
  entryToDelete.value = entry;
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!entryToDelete.value) return;
  const entry = entryToDelete.value;
  showDeleteModal.value = false;
  entryToDelete.value = null;
  try {
    await deleteEntry(entry.id!);
  } catch (error) {
    console.error("Error deleting entry:", error);
    alert($t("deleteError"));
  }
}

function cancelDelete() {
  showDeleteModal.value = false;
  entryToDelete.value = null;
}

function handleLanguageChange(newLanguages: {
  source: string;
  target: string;
}) {
  // Update the settings
  sourceLanguage.value = (languageOptions.find(
    (lang) => lang.id === newLanguages.source
  ) ?? languageOptions[0])!;
  targetLanguage.value = (languageOptions.find(
    (lang) => lang.id === newLanguages.target
  ) ?? languageOptions[1])!;

  // Locale will be automatically updated by the watcher on sourceLanguage
}

async function startJournal() {
  try {
    if (todayEntry.value && todayEntry.value.id) {
      // Today's entry exists and has an id, navigate to it
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

<style>
.checkmark-completed {
  transform: scale(1.2);
}

.checkmark-spring {
  animation: grow-scale 0.8s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
}

@keyframes grow-scale {
  0% {
    transform: scale(0);
  }
  60% {
    transform: scale(1.4);
  }
  100% {
    transform: scale(1.2);
  }
}
</style>
