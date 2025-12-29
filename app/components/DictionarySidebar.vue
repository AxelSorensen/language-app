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
        <h2 class="text-lg font-semibold text-gray-800">Vocabulary</h2>
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

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4">
        <div
          v-if="dictionaryWords.length === 0"
          class="text-center text-gray-500 py-8"
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

        <div v-else class="space-y-2">
          <div
            v-for="entry in sortedWords"
            :key="`${entry.word}-${entry.language}`"
            class="bg-gray-50 rounded-lg p-3 border border-gray-200"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="font-medium text-gray-900">{{ entry.word }}</div>
                <div class="text-sm text-gray-600 mt-1">
                  {{ entry.translation }}
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  Added {{ formatDate(entry.addedAt) }}
                </div>
              </div>
              <button
                @click="removeWord(entry.word, entry.language)"
                class="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Remove from dictionary"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 p-4">
        <button
          @click="clearDictionary"
          class="w-full px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          :disabled="dictionaryWords.length === 0"
        >
          Clear All Words
        </button>
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
import { computed, onMounted, onUnmounted } from "vue";
import { useDictionary } from "~/composables/useDictionary";

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const {
  dictionary: dictionaryWords,
  removeWord,
  clearDictionary,
  totalWords,
} = useDictionary();

const sortedWords = computed(() => {
  return [...dictionaryWords.value].sort(
    (a, b) => b.addedAt.getTime() - a.addedAt.getTime()
  );
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

const closeSidebar = () => {
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
    width: 320px;
    right: 0;
    left: auto;
    border-left: 1px solid #e5e7eb;
  }
}
</style>
