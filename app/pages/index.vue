<template>
  <div class="max-w-4xl mx-auto p-4">
    <div class="flex justify-between items-center mb-4">
      <LanguageSelector @languageChange="handleLanguageChange" />
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
    </div>

    <div
      v-if="!todayEntry || todayEntry.wordCount < wordGoal"
      class="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-blue-900">Today's Journal</h2>
        <div class="text-sm text-blue-600">
          {{ todayEntry?.wordCount || 0 }}/{{ wordGoal }} words
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
            ? `You've written ${todayEntry.wordCount} words. Keep going to reach ${wordGoal}!`
            : "You haven't started today's journal entry yet."
        }}
      </p>
      <NuxtLink
        to="/write"
        class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
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
        {{ todayEntry ? "Continue Writing" : "Start Today's Journal" }}
      </NuxtLink>
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
          All Has Been Done for Today
        </h3>
        <p class="text-gray-700 mt-2">
          You've successfully completed your daily journal entry. Take a moment
          to reflect on your progress!
        </p>
      </div>
    </div>

    <!-- Previous Entries -->
    <h2 class="text-lg font-medium mb-4 text-gray-900">Previous Entries</h2>
    <div v-if="previousEntries.length > 0" class="mb-6">
      <div class="space-y-4">
        <div
          v-for="entry in previousEntries"
          :key="entry.date"
          class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                {{ formatDate(entry.date) }}
              </h3>
              <p class="text-sm text-gray-500">{{ entry.wordCount }} words</p>
            </div>
            <div class="flex items-center">
              <div
                v-if="entry.wordCount >= wordGoal"
                class="flex items-center text-green-600"
              >
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
                <span class="text-sm font-medium">Complete</span>
              </div>
            </div>
          </div>
          <p class="text-gray-700 leading-relaxed">
            {{
              entry.text.length > 200
                ? entry.text.substring(0, 200) + "..."
                : entry.text
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
                {{ formatDate(todayEntry.date) }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ todayEntry.wordCount }} words
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
                <span class="text-sm font-medium">Complete</span>
              </div>
            </div>
          </div>
          <p class="text-gray-700 leading-relaxed">
            {{
              todayEntry.text.length > 200
                ? todayEntry.text.substring(0, 200) + "..."
                : todayEntry.text
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
          No previous entries yet
        </h3>
        <p class="text-gray-500">
          Start writing your first journal entry to see it here!
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import LanguageSelector from "~/components/LanguageSelector.vue";
import ProgressBar from "~/components/ProgressBar.vue";
import { WORD_GOAL } from "~/constants";
import { useEntries } from "~/composables/useEntries";

interface DiaryEntry {
  date: string;
  text: string;
  wordCount: number;
}

const { entries } = useEntries();

const wordGoal = WORD_GOAL;

const today = computed(() => {
  const now = new Date();
  return now.toISOString().split("T")[0];
});

const todayEntry = computed(() => entries.value[today.value]);

const previousEntries = computed(() => {
  return Object.values(entries.value)
    .filter((entry) => entry.date !== today.value)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});
const streak = computed(() => {
  const completedDates = Object.values(entries.value)
    .filter((entry) => entry.wordCount >= wordGoal)
    .map((entry) => entry.date)
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
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function handleLanguageChange(newLanguages: any) {
  localStorage.setItem("journal-languages", JSON.stringify(newLanguages));
}
</script>
