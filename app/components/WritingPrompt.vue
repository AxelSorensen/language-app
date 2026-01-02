<template>
  <div
    class="text-center text-sm w-full transition-opacity duration-300 mt-6"
    :class="isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'"
  >
    <p class="text-gray-600 mb-4 w-full">{{ $t("dontKnowWhatToWrite") }}</p>

    <!-- Initial Roll the Dice CTA -->
    <button
      v-if="!currentTopic"
      @click="pickRandomTopic"
      class="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="3"
          stroke-width="2"
          fill="currentColor"
          fill-opacity="0.1"
        />
        <circle cx="6" cy="6" r="1.5" fill="currentColor" />
        <circle cx="18" cy="6" r="1.5" fill="currentColor" />
        <circle cx="6" cy="18" r="1.5" fill="currentColor" />
        <circle cx="18" cy="18" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
      {{ $t("rollTheDice") }}
    </button>

    <!-- Topic with small dice button -->
    <div v-else class="mt-4 flex items-center justify-center gap-3">
      <p
        v-if="isGeneratingTopic"
        class="text-xl font-semibold text-gray-500 animate-pulse"
      >
        {{ $t("generating") }}
      </p>
      <p v-else class="text-xl font-semibold text-gray-800">
        {{ currentTopic }}
      </p>
      <button
        @click="pickRandomTopic"
        class="shrink-0 p-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors"
      >
        <svg
          :class="{ 'animate-spin': isDiceAnimating }"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="3"
            stroke-width="2"
            fill="currentColor"
            fill-opacity="0.1"
          />
          <circle cx="6" cy="6" r="1.5" fill="currentColor" />
          <circle cx="18" cy="6" r="1.5" fill="currentColor" />
          <circle cx="6" cy="18" r="1.5" fill="currentColor" />
          <circle cx="18" cy="18" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["topicSelected"]);

const writingTopics = ref([
  "What was your most memorable experience at work?",
  "Describe your dream vacation destination and why you want to go there",
  "What was your favorite meal and the story behind it?",
  "Describe a special moment you shared with your family",
  "How do you like to spend your weekends?",
  "Describe the place where you live and what you like about it",
  "What was a time when you cooked something special?",
  "Describe your favorite hobby and how you got started with it",
  "What was a concert or music experience that moved you?",
  "Describe your favorite shopping experience",
  "How does your exercise routine make you feel?",
  "Describe a fun outing you had with friends recently",
  "What was a TV show or movie that had a big impact on you?",
  "Describe your most memorable vacation and what made it special",
  "What was a book that changed your perspective?",
  "Describe what you love most about your city",
  "How do you like to unwind after work?",
  "Describe your favorite restaurant and what makes it special",
  "What was something you recently bought and why you chose it?",
]);

const currentTopic = ref("");
const isDiceAnimating = ref(false);
const isGeneratingTopic = ref(false);

function pickRandomTopic() {
  isDiceAnimating.value = true;
  isGeneratingTopic.value = true;
  const randomIndex = Math.floor(Math.random() * writingTopics.value.length);
  currentTopic.value = writingTopics.value[randomIndex];

  // Stop animation after 500ms
  setTimeout(() => {
    isDiceAnimating.value = false;
    isGeneratingTopic.value = false;
  }, 500);

  // Emit the selected topic
  emit("topicSelected", currentTopic.value);
}
</script>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 0.8s ease-in-out;
}
</style>
