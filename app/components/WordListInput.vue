<template>
  <div class="max-w-[800px] relative">
    <div
      class="flex flex-row flex-wrap justify-center items-center text-2xl font-sans"
    >
      <template v-for="(word, idx) in words" :key="idx">
        <SimpleTooltip
          :enabled="!selected_word_index"
          :text="getTooltipText(word.text.trim(), idx)"
          :type="getTooltipType(idx)"
          :explanation="getExplanationText(idx)"
          @applyCorrection="applyCorrection(idx)"
          @deleteWord="deleteWord(idx)"
        >
          <input
            ref="word_refs"
            :placeholder="
              idx === 0 && words.length === 1 ? 'Start writing...' : ''
            "
            v-model="words[idx].text"
            @input="handleWordInput"
            @mousedown="handleWordMouseDown($event, word.text.trim(), idx)"
            @contextmenu="handleRightClick($event, idx)"
            @focus="current_word_index = idx"
            @blur="
              () => {
                handleWordBlur();
                current_word_index = null;
              }
            "
            @keydown="handleWordKeydown($event, idx)"
            :class="[
              'mr-1 outline-none border-none field-sizing-content transition-all duration-200',
              output &&
              output.corrections &&
              words[idx] &&
              output.corrections[word.id] &&
              output.corrections[word.id].correction
                ? output.corrections[word.id].correction === 'null'
                  ? 'text-red-600'
                  : 'text-amber-500'
                : 'text-gray-800',
              idx === selected_word_index ? 'bg-blue-100 rounded px-1' : '',
              pendingWords.has(word.id) ? 'animate-pulse' : '',
              highlightedWordIndices.has(idx)
                ? 'underline decoration-dashed decoration-gray-400 decoration-1 underline-offset-4'
                : '',
            ]"
          />
        </SimpleTooltip>
      </template>

      <!-- Translate Input -->
      <input
        v-if="translateMode"
        ref="translate_input_ref"
        class="mr-1 outline-none border-none field-sizing-content text-2xl font-sans"
        :class="[
          isTranslating ? ' animate-pulse text-purple-500' : 'text-gray-500',
        ]"
        placeholder="words to translate..."
        v-model="wordsToTranslate"
        @keydown="handleTranslateKeydown"
      />
    </div>

    <!-- Writing Topic CTA - Full width under input -->
    <div
      v-if="!words[0].text"
      class="mt-6 text-center transition-opacity duration-300"
      :class="
        words.length === 1 && !words[0].text
          ? 'opacity-100'
          : 'opacity-0 pointer-events-none'
      "
    >
      <p class="text-gray-600 mb-4">Don't know what to write?</p>

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
        Roll the dice
      </button>

      <!-- Topic with small dice button -->
      <div v-else class="mt-4 flex items-center justify-center gap-3">
        <p
          v-if="isGeneratingTopic"
          class="text-xl font-semibold text-gray-500 animate-pulse"
        >
          Generating...
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

    <!-- Full Translated Sentence Display -->
    <div v-if="fullTranslatedSentence" class="mt-8 mb-2 text-lg text-gray-500">
      {{ fullTranslatedSentence }}
      <!-- Spinner -->
      <Loader v-if="isTranslatingFullSentence" class="ml-2" />
    </div>

    <!-- Context Menu -->
    <div
      v-if="contextMenu.visible"
      class="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg py-1 min-w-48"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <button
        class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
        @click="selectWord(contextMenu.wordIndex)"
      >
        View Details
      </button>
      <button
        class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
        @click="deleteWord(contextMenu.wordIndex)"
      >
        Delete Word
      </button>
    </div>

    <!-- Overlay to close context menu -->
    <div
      v-if="contextMenu.visible"
      class="fixed inset-0 z-40"
      @click="hideContextMenu"
    ></div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, computed } from "vue";
import SimpleTooltip from "./SimpleTooltip.vue";
import Loader from "./Loader.vue";

const emit = defineEmits(["wordClick"]);

const props = defineProps({
  selected_word_index: {
    type: Number,
    default: null,
  },
  languages: {
    type: Object,
    default: () => ({ source: "en", target: "es" }),
  },
});

const words = defineModel("words", {
  type: Array,
  default: () => [{ id: "first", text: "" }],
});
const output = ref({ corrections: {} });
const sentenceErrors = ref(null);
const selected_word_ref = ref(null);
const word_refs = ref([]);
const translate_input_ref = ref(null);
const current_word_index = ref(null);
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  wordIndex: null,
});
const translateMode = ref(false);
const wordsToTranslate = ref("");
const isTranslating = ref(false);
const fullTranslatedSentence = ref("");
const checkTimeout = ref(null);
const isTranslatingFullSentence = ref(false);
const pendingWords = ref(new Set());
const currentSelection = ref(null);
const writingTopics = ref([
  "My family and I",
  "My daily routine",
  "My favorite foods",
  "My hobbies and interests",
  "My home and room",
  "My best friend",
  "What I like to do on weekends",
  "My favorite season",
  "My school or work",
  "My favorite animal",
  "My last vacation or trip",
]);
const currentTopic = ref("");
const isDiceAnimating = ref(false);
const isGeneratingTopic = ref(false);

const highlightedWordIndices = computed(() => {
  if (!sentenceErrors.value?.wrong_text) return new Set();

  const wrongText = sentenceErrors.value.wrong_text.toLowerCase().trim();
  const wrongWords = wrongText.split(/\s+/);
  const sentenceWords = words.value.map((w) => w.text.toLowerCase().trim());
  const highlighted = new Set();

  // Find the exact sequence of wrong words in the sentence
  for (let i = 0; i <= sentenceWords.length - wrongWords.length; i++) {
    let allMatch = true;
    for (let j = 0; j < wrongWords.length; j++) {
      if (sentenceWords[i + j] !== wrongWords[j]) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) {
      // Found the exact sequence, highlight these words
      for (let k = 0; k < wrongWords.length; k++) {
        highlighted.add(i + k);
      }
      break; // Take the first match
    }
  }

  return highlighted;
});

function generateWordId() {
  return "word-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
}

async function checkWord(word, wordIndex) {
  // FOR NOW
  if (
    pendingWords.value.has(word.id) ||
    (wordIndex < words.value.length &&
      Object.keys(output.value.corrections).includes(
        words.value[wordIndex].id
      ) &&
      output.value.corrections[word.id].word === word.text)
  )
    return; // Already checking
  pendingWords.value.add(word.id);
  try {
    const contextText = words.value.map((w) => w.text).join(" ");

    const res = await $fetch("/api/process_word", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: word.text,
        context: contextText,
      }),
    });

    if (!output.value) {
      output.value = { corrections: {} };
    }

    if (res) {
      output.value.corrections[word.id] = res;
    }
  } catch (e) {
    console.error("Check word failed:", e);
  } finally {
    pendingWords.value.delete(word.id);
  }
}

async function checkSentence() {
  const sentence = words.value
    .map((w) => w.text)
    .join(" ")
    .trim();
  if (!sentence) {
    sentenceErrors.value = null;
    return;
  }

  try {
    const res = await $fetch("/api/check-sentence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sentence: sentence,
      }),
    });

    sentenceErrors.value = res;
  } catch (e) {
    console.error("Check sentence failed:", e);
    sentenceErrors.value = null;
  }
}

function handleWordKeydown(e, idx) {
  // Handle Tab key - toggle translate mode
  if (e.key === "Tab") {
    e.preventDefault();
    // Remove empty strings from words array
    words.value = words.value.filter((word) => word.text.trim() !== "");
    // If all words were empty, add back one empty string
    if (words.value.length === 0) {
      words.value.push({ id: "first", text: "" });
    }
    translateMode.value = !translateMode.value;
    if (translateMode.value) {
      // Focus the translate input when entering translate mode
      nextTick(() => {
        translate_input_ref.value?.focus();
      });
    }
    return;
  }

  // Handle select all (Ctrl+A or Cmd+A)

  if (e.key === "Backspace") {
    if (
      e.target.selectionStart === 0 &&
      e.target.selectionEnd === 0 &&
      idx > 0
    ) {
      e.preventDefault();
      const prevIdx = idx - 1;
      const prevValue = words.value[prevIdx].text;
      words.value[prevIdx] = {
        id: words.value[prevIdx].id,
        text: prevValue + e.target.value,
      };
      words.value.splice(idx, 1);
      nextTick(() => {
        word_refs.value[prevIdx]?.focus();
        if (word_refs.value[prevIdx]) {
          word_refs.value[prevIdx].selectionStart = prevValue.length;
          word_refs.value[prevIdx].selectionEnd = prevValue.length;
        }
      });
    }
    return;
  }

  if (e.key === " " || e.key === "Enter") {
    if (translateMode.value) {
      // In translate mode, allow spaces and enters normally
      return;
    }
    e.preventDefault();

    checkWord(words.value[idx], idx);

    // Always update the current word with the text before cursor

    // Always add a new word after the current one
    words.value.splice(idx + 1, 0, { id: generateWordId(), text: "" });
    nextTick(() => {
      word_refs.value[idx + 1]?.focus();
      if (word_refs.value[idx + 1]) {
        word_refs.value[idx + 1].selectionStart = 0;
        word_refs.value[idx + 1].selectionEnd = 0;
      }
    });

    // Check the entire sentence for errors
    nextTick(() => {
      checkSentence();
    });

    // Translate the full sentence after adding word
    nextTick(() => {
      translateFullSentence();
    });
    return;
  }

  if (e.key === "ArrowLeft" && e.target.selectionStart === 0) {
    if (idx > 0) {
      word_refs.value[idx - 1]?.focus();
      e.preventDefault();
    }
  } else if (
    e.key === "ArrowRight" &&
    e.target.selectionStart === e.target.value.length
  ) {
    if (idx < words.value.length - 1) {
      word_refs.value[idx + 1]?.focus();
      e.preventDefault();
    }
  }

  // Trigger checks after any key interaction (except Tab which returns early)
  if (checkTimeout.value) clearTimeout(checkTimeout.value);
  checkTimeout.value = setTimeout(() => {
    // Check if all words are empty - if so, reset everything
    const allWordsEmpty = words.value.every((word) => !word.text.trim());
    if (allWordsEmpty) {
      output.value = { corrections: {} };
      sentenceErrors.value = null;
      fullTranslatedSentence.value = "";
      return;
    }

    checkSentence();
    translateFullSentence();
  }, 500);
}

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

function handleWordBlur() {
  if (checkTimeout.value) {
    clearTimeout(checkTimeout.value);
    checkTimeout.value = null;
  }
  selected_word_ref.value = null;
}

function handleWordInput() {
  if (checkTimeout.value) clearTimeout(checkTimeout.value);
  checkTimeout.value = setTimeout(() => {
    // Check if all words are empty - if so, reset everything
    const allWordsEmpty = words.value.every((word) => !word.text.trim());
    if (allWordsEmpty) {
      console.log("cleaning");
      output.value = { corrections: {} };
      sentenceErrors.value = null;
      fullTranslatedSentence.value = "";
      return;
    }

    checkWord(words.value[current_word_index.value], current_word_index.value);
    checkSentence();
    translateFullSentence();
  }, 500);
}

function applyCorrection(idx) {
  // Check if this is a sentence correction
  if (
    highlightedWordIndices.value.has(idx) &&
    sentenceErrors.value?.wrong_text &&
    sentenceErrors.value?.correction
  ) {
    // Find the sequence of wrong words and replace them with the correction
    const wrongWords = sentenceErrors.value.wrong_text.split(/\s+/);
    const correctionWords = sentenceErrors.value.correction.split(/\s+/);

    // Find where the wrong sequence starts
    let startIdx = -1;
    for (let i = 0; i <= words.value.length - wrongWords.length; i++) {
      let allMatch = true;
      for (let j = 0; j < wrongWords.length; j++) {
        if (
          words.value[i + j]?.text.toLowerCase().trim() !==
          wrongWords[j].toLowerCase()
        ) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) {
        startIdx = i;
        break;
      }
    }

    if (startIdx !== -1) {
      // Replace the wrong words with correction words
      const newWords = [...words.value];
      newWords.splice(
        startIdx,
        wrongWords.length,
        ...correctionWords.map((text) => ({ id: generateWordId(), text }))
      );
      words.value = newWords;

      // Clear the sentence errors
      sentenceErrors.value = null;

      // Focus the first corrected word
      nextTick(() => {
        if (word_refs.value[startIdx]) {
          word_refs.value[startIdx].focus();
          word_refs.value[startIdx].selectionStart = correctionWords[0].length;
          word_refs.value[startIdx].selectionEnd = correctionWords[0].length;
        }
        checkWord(words.value[startIdx], startIdx);
        translateFullSentence();
      });
    }
    return;
  }

  // Handle regular word corrections
  if (!output.value || !output.value.corrections) return;

  const wordId = words.value[idx]?.id;
  if (!wordId) return;

  const wordInfo = output.value.corrections[wordId];
  if (wordInfo && wordInfo.correction) {
    words.value[idx] = { id: generateWordId(), text: wordInfo.correction };
    // Clear the correction so the word is no longer highlighted
    wordInfo.word = wordInfo.correction;
    wordInfo.correction = null;

    // Focus the input and set cursor to the end
    nextTick(() => {
      if (word_refs.value[idx]) {
        word_refs.value[idx].focus();
        const textLength = words.value[idx].text.length;
        word_refs.value[idx].selectionStart = textLength;
        word_refs.value[idx].selectionEnd = textLength;
      }
    });
  }
}

function getTooltipText(trimmedWord, idx) {
  // Check if this word is highlighted for sentence correction
  if (
    highlightedWordIndices.value.has(idx) &&
    sentenceErrors.value?.correction
  ) {
    return sentenceErrors.value.correction;
  }

  if (!output.value || !output.value.corrections) {
    return "";
  }

  const wordId = words.value[idx]?.id;
  if (!wordId) return "";

  const wordInfo = output.value.corrections[wordId];

  if (!wordInfo) {
    return "";
  }

  if (wordInfo.correction) {
    return wordInfo.correction;
  } else {
    return wordInfo.translation || "";
  }
}

function getTooltipType(idx) {
  // Check if this word is highlighted for sentence correction
  if (
    highlightedWordIndices.value.has(idx) &&
    sentenceErrors.value?.correction
  ) {
    return "correction";
  }

  if (!output.value || !output.value.corrections) {
    return "translation";
  }

  const wordId = words.value[idx]?.id;
  if (!wordId) return "translation";

  const wordInfo = output.value.corrections[wordId];

  if (!wordInfo) {
    return "translation";
  }

  return wordInfo.correction ? "correction" : "translation";
}

function getExplanationText(idx) {
  // Check if this word is highlighted for sentence correction
  if (
    highlightedWordIndices.value.has(idx) &&
    sentenceErrors.value?.explanation
  ) {
    return sentenceErrors.value.explanation;
  }

  // Check if this word has word-level correction with explanation
  if (!output.value || !output.value.corrections) {
    return "";
  }

  const wordId = words.value[idx]?.id;
  if (!wordId) return "";

  const wordInfo = output.value.corrections[wordId];
  return wordInfo?.explanation || "";
}

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

function deleteWord(wordIndex) {
  words.value.splice(wordIndex, 1);
  if (words.value.length === 0) {
    words.value.push({ id: "first", text: "" });
  }
  hideContextMenu();

  // Trigger checks after deletion
  if (checkTimeout.value) clearTimeout(checkTimeout.value);
  checkTimeout.value = setTimeout(() => {
    // Check if all words are empty - if so, reset everything
    const allWordsEmpty = words.value.every((word) => !word.text.trim());
    if (allWordsEmpty) {
      output.value = { corrections: {} };
      sentenceErrors.value = null;
      fullTranslatedSentence.value = "";
      return;
    }

    checkSentence();
    translateFullSentence();
  }, 500);
}

function hideContextMenu() {
  contextMenu.value.visible = false;
}

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
}

async function translateFullSentence() {
  const sentence = words.value
    .map((w) => w.text)
    .join(" ")
    .trim();
  if (!sentence) return;

  isTranslatingFullSentence.value = true;

  try {
    const res = await $fetch("/api/translate_sentence_to_english", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sentence: sentence,
      }),
    });

    if (res.result?.translated) {
      fullTranslatedSentence.value = res.result.translated;
    }
  } catch (e) {
    console.error("Sentence translation failed:", e);
  } finally {
    isTranslatingFullSentence.value = false;
  }
}

async function translateAndAppendWords() {
  if (!wordsToTranslate.value.trim()) return;

  const sentence = words.value.map((w) => w.text).join(" ");
  isTranslating.value = true;

  try {
    const res = await $fetch("/api/translate_text_to_target", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: wordsToTranslate.value.trim(),
        sentence: sentence,
      }),
    });

    if (res.result?.translated) {
      // Split translated text into words and append to words array
      const translatedWords = res.result.translated
        .split(/\s+/)
        .filter((word) => word.trim());
      const initialLength = words.value.length;

      // Check each new word first
      const checkPromises = [];
      const tempWords = translatedWords.map((text) => ({
        id: generateWordId(),
        text,
      }));
      for (let i = 0; i < tempWords.length; i++) {
        checkPromises.push(checkWord(tempWords[i], initialLength + i));
      }
      await Promise.all(checkPromises);

      // Now add the words to the UI
      words.value.push(...tempWords);

      // Focus the last added word and position cursor at the end
      if (translatedWords.length > 0) {
        nextTick(() => {
          const lastWordIndex = initialLength + translatedWords.length - 1;
          if (word_refs.value[lastWordIndex]) {
            word_refs.value[lastWordIndex].focus();
            word_refs.value[lastWordIndex].selectionStart =
              translatedWords[translatedWords.length - 1].length;
            word_refs.value[lastWordIndex].selectionEnd =
              translatedWords[translatedWords.length - 1].length;
          }
        });
      }
    }
  } catch (e) {
    console.error("Translation failed:", e);
  } finally {
    isTranslating.value = false;
  }

  // Clear translate input and exit translate mode
  wordsToTranslate.value = "";
  translateMode.value = false;
}

async function handleTranslateKeydown(e) {
  // Handle Tab key to exit translate mode and translate words
  if (e.key === "Tab") {
    e.preventDefault();
    if (wordsToTranslate.value.trim()) {
      await translateAndAppendWords();

      await checkSentence();
      await translateFullSentence();
    } else {
      translateMode.value = false;
    }
    return;
  }
  // Allow all other keys including spaces
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
