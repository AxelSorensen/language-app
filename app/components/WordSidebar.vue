<template>
  <div
    v-if="sidebarOpen"
    class="fixed right-0 top-0 h-full w-[800px] bg-white border border-gray-200 shadow-lg z-50 transform transition-transform duration-300 ease-in-out p-6"
  >
    <div>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-800">
          {{ selectedWord }}
        </h2>
        <button
          @click="closeSidebar"
          class="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg
            class="w-5 h-5 text-gray-500"
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

      <div class="space-y-4">
        <div class="p-4 bg-gray-50 rounded-lg">
          <h3 class="font-medium text-gray-700 mb-2">Word Details</h3>
          <p class="text-sm text-gray-600">
            Additional information about "{{ selectedWord }}" would go here.
          </p>
        </div>

        <div v-if="sentences.length > 0" class="mb-6">
          <h3 class="font-medium text-gray-700 mb-4">Example Sentences</h3>
          <div class="space-y-3">
            <p
              v-for="(sentence, idx) in sentences"
              :key="idx"
              class="text-base text-gray-700 leading-relaxed"
            >
              <span
                v-for="(word, wordIdx) in sentence.split(' ')"
                :key="wordIdx"
                :class="[
                  'mr-1',
                  isMatchingWord(word, selectedWord)
                    ? 'text-blue-500 font-bold'
                    : '',
                ]"
              >
                {{ word }}
              </span>
            </p>
          </div>
        </div>

        <div v-if="wordInfo && wordInfo.fact" class="mb-6">
          <h3 class="font-medium text-gray-700 mb-4">Fun Fact</h3>
          <div class="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <p class="text-sm text-blue-800">{{ wordInfo.fact }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  sidebarOpen: {
    type: Boolean,
    default: false,
  },
  selectedWord: {
    type: String,
    default: "",
  },
  sentences: {
    type: Array,
    default: () => [],
  },
  wordInfo: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["closeSidebar"]);

function closeSidebar() {
  emit("closeSidebar");
}

function isMatchingWord(word, selectedWord) {
  if (!selectedWord) return false;
  // Remove punctuation and compare case-insensitively
  const cleanWord = word.replace(/[.,!?;:"'\s]/g, "").toLowerCase();
  const cleanSelectedWord = selectedWord.trim().toLowerCase();
  return cleanWord === cleanSelectedWord;
}
</script>
