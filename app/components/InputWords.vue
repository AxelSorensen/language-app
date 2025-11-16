<template>
  <div class="max-w-[800px] p-4 flex flex-col justify-center relative">
    <button
      @click="wordsActions.clearAllText"
      class="fixed top-4 right-4 cursor-pointer px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors z-50 flex items-center gap-2"
      title="Clear all text"
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
      <span class="text-sm font-medium text-gray-700">Reset</span>
    </button>
    <div
      class="flex flex-row flex-wrap relative justify-center items-center text-2xl font-sans"
    >
      <template v-for="(word, idx) in words" :key="idx">
        <SimpleTooltip
          :text="word.correction"
          @applyCorrection="applyCorrection(idx)"
          @deleteWord="deleteWord(idx)"
        >
          <input
            autofocus
            inputmode="none"
            :ref="(el) => (wordsRefs[idx] = el)"
            :placeholder="
              idx === 0 && words?.length === 1 ? 'Start writing...' : ''
            "
            v-model="words[idx].text"
            autocapitalize="off"
            @focus="handleWordFocus(idx)"
            @blur="handleWordBlur(idx)"
            :class="[
              'mr-1 outline-none border-none field-sizing-content  transition-all duration-200',
            ]"
          />
        </SimpleTooltip>
      </template>

      <input
        inputmode="none"
        v-if="
          translateModeState.translateMode || translateModeState.isTranslating
        "
        ref="translate_input_ref"
        class="mr-1 outline-none border-none field-sizing-content text-2xl font-sans text-purple-500"
        :class="[translateModeState.isTranslating ? 'animate-pulse' : '']"
        placeholder="words to translate..."
        v-model="translateModeState.wordsToTranslate"
      />
    </div>

    <!-- Writing Topic CTA - Full width under input -->
    <WritingPrompt
      :is-visible="words?.length === 1 && !words[0]?.text"
      @topic-selected="handleTopicSelected"
    />

    <!-- Full Translated Sentence Display -->
    <div v-if="fullTranslatedSentence" class="mt-8 mb-2 text-lg text-gray-500">
      {{ fullTranslatedSentence }}
      <!-- Spinner -->
      <Loader v-if="isTranslatingFullSentence" class="ml-2" />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from "vue";
import { LanguageService } from "~/services/LanguageService";
import SimpleTooltip from "./SimpleTooltip.vue";
import Loader from "./Loader.vue";
import WritingPrompt from "./WritingPrompt.vue";
import { useTranslateMode } from "~/composables/useTranslateMode";

const emit = defineEmits(["wordClick"]);
const {
  state: wordsState,
  actions: wordsActions,
  refs: wordsRefs,
} = useWords();

const { state: translateModeState } = useTranslateMode();
// Use the words composable first

const selected_word_ref = ref(null);
const translate_input_ref = ref(null);

// Use wordsState refs
const words = wordsState.value.words;

// Update the words composable with keyboard state
// Note: This is a bit of a hack - ideally we'd restructure this

const handleWordBlur = (idx) => {
  // Keep keyboard visible when blurring, but don't change current_word_index
  // This allows keyboard to continue working if user clicks buttons
};

const handleWordFocus = (idx) => {
  console.log("Focusing word index:", idx);
  if (idx !== null) {
    wordsActions.setCurrentInputIndex(idx);
  }
};

const hasText = computed(() => {
  return words.value.some((word) => word.text.trim() !== "");
});

function handleWordMouseDown(event, word, idx) {
  // Only open sidebar on Ctrl+click or Cmd+click
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault(); // Prevent default focus behavior
    event.stopPropagation(); // Stop event bubbling
    emit("wordClick", idx);
    // Unfocus only if this input is currently focused
    if (document.activeElement === event.target) {
      nextTick(() => {
        event.target.blur();
      });
    }
    return;
  }
  // For regular clicks, allow normal focus behavior
  selected_word_ref.value = word_refs.value[idx];
}

// wordsActions.onTypingTimeout(async () => {
//   // ...get sentence from words, etc.
//   const sentence = wordsActions.getWordContext(
//     wordsState.value.current_input_index
//   );
//   const result = await LanguageService.checkSentence(sentence);
//   wordsState.value.errors.push(result);
//   // ...update UI state with result
// });

wordsActions.onSentenceCreated(() => {
  console.log("Sentence created callback triggered.");
  // You can add additional logic here if needed when a new sentence is created
});

function handleRightClick(event, wordIndex) {
  event.preventDefault();
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    wordIndex: wordIndex,
  };
}

function selectWord(wordIndex) {
  emit("wordClick", wordIndex);
  hideContextMenu();
}

function hideContextMenu() {
  contextMenu.value.visible = false;
}

function handleTopicSelected(topic) {
  // Handle the selected topic if needed
  console.log("Selected topic:", topic);
}

defineExpose({
  translate_input_ref,
});
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
