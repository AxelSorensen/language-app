<template>
  <div
    class="fixed top-0 h-full bg-white shadow-lg z-50 transform transition-transform duration-300 sidebar-container"
    :class="{ 'translate-x-0': isOpen, 'translate-x-full': !isOpen }"
  >
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div
        class="flex items-center justify-between p-4 border-b border-gray-200"
      >
        <h2 class="text-lg font-semibold text-gray-800">
          {{ $t("vocabulary") }}
        </h2>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">{{ totalWords }} words</span>
          <button
            @click="closeSidebar"
            class="p-1 hover:bg-gray-100 rounded-md transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="p-4 border-b border-gray-200">
        <div class="relative">
          <svg
            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('searchWordsOrTranslations')"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div class="flex-1 overflow-y-auto p-4">
        <div
          v-if="dictionaryWords.length === 0"
          class="h-full flex flex-col items-center justify-center text-center text-gray-500"
        >
          <svg
            class="w-12 h-12 mx-auto mb-4 text-gray-300"
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
          <p>No words learned yet</p>
          <p class="text-sm mt-1">
            Learned words will appear here automatically
          </p>
        </div>

        <div
          v-else-if="filteredWords.length === 0"
          class="h-full flex flex-col items-center justify-center text-center text-gray-500"
        >
          <svg
            class="w-12 h-12 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
          <p>No words match your search</p>
          <p class="text-sm mt-1">Try a different search term</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="entry in filteredWords"
            :key="`${entry.word}-${entry.language}`"
            class="bg-gray-50 rounded-lg p-3 border border-gray-200 transition-all duration-500"
          >
            <div class="flex flex-col">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="font-medium text-gray-900">
                    {{ entry.word }}
                  </div>
                  <div class="text-sm text-gray-600 mt-1">
                    {{ entry.translation }}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    v-if="isNewlyAdded(entry)"
                    class="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                  >
                    NEW
                  </span>
                  <button
                    @click="handleHeartClick(entry.word)"
                    class="p-1 transition-colors"
                    :class="[
                      isFavorited(entry.word)
                        ? 'text-red-500'
                        : 'text-gray-400 hover:text-red-500',
                      {
                        'heart-click': heartAnimating.has(
                          entry.word.toLowerCase()
                        ),
                      },
                    ]"
                    :title="$t('toggleFavorite')"
                  >
                    <svg
                      class="w-4 h-4"
                      :fill="isFavorited(entry.word) ? 'currentColor' : 'none'"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="flex justify-between mt-4">
                <div class="text-xs text-gray-400">
                  {{ $t("used") }} {{ entry.usageCount }}
                  {{ entry.usageCount === 1 ? $t("time") : $t("times") }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Overlay -->
  <Transition name="overlay">
    <div
      v-if="isOpen"
      @click="closeSidebar"
      class="bg-black absolute opacity-20 top-0 overlay-bg"
    ></div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useVocabulary } from "~/composables/useVocabulary";

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const searchQuery = ref("");
const heartAnimating = ref(new Set<string>());

const {
  vocabulary: dictionaryWords,
  newlyAddedWords,
  newWordsCount,
  removeWord,
  clearVocabulary,
  clearNewWordsCount,
  clearNewlyAddedWords,
  toggleFavorite,
  isFavorited,
  totalWords,
} = useVocabulary();

const filteredWords = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) {
    return [...dictionaryWords.value].sort(
      (a, b) => b.addedAt.getTime() - a.addedAt.getTime()
    );
  }
  return dictionaryWords.value
    .filter(
      (entry) =>
        entry.word.toLowerCase().includes(query) ||
        entry.translation.toLowerCase().includes(query)
    )
    .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
});

const formatDate = (date: Date) => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return "today";
  } else if (diffDays === 2) {
    return "yesterday";
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const isNewlyAdded = (entry: { word: string; language: string }) => {
  const key = `${entry.word.toLowerCase()}`;
  return newlyAddedWords.value.has(key);
};

const handleHeartClick = (word: string) => {
  const key = word.toLowerCase();
  heartAnimating.value.add(key);
  toggleFavorite(word);
  setTimeout(() => {
    heartAnimating.value.delete(key);
  }, 200);
};

const closeSidebar = () => {
  clearNewWordsCount();
  clearNewlyAddedWords();
  emit("close");
};

// Close on escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.isOpen) {
    closeSidebar();
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.heart-click {
  animation: heartPop 0.2s ease;
}

@keyframes heartPop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* Mobile styles (default) */
.sidebar-container {
  width: 100vw;
  left: 0;
  border-left: none;
}

.overlay-bg {
  width: 100vw;
  height: 100vh;
}

/* Desktop styles */
@media (min-width: 768px) {
  .sidebar-container {
    width: 33.333vw;
    right: 0;
    left: auto;
    border-left: 1px solid #e5e7eb;
  }
}
</style>
