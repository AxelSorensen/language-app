<template>
  <div class="max-w-[800px]">
    <div class="flex flex-row flex-wrap items-center text-2xl font-sans">
      <template v-for="(word, idx) in words" :key="idx">
        <SimpleTooltip
          :enabled="!selected_word_index"
          :text="getTooltipText(word.trim(), idx)"
          :type="getTooltipType(idx)"
          @applyCorrection="applyCorrection(idx)"
        >
          <input
            ref="word_refs"
            :placeholder="idx === 0 && words.length === 1 ? 'Type word...' : ''"
            v-model="words[idx]"
            @mousedown="handleWordMouseDown($event, word.trim(), idx)"
            @contextmenu="handleRightClick($event, idx)"
            @blur="
              () => {
                handleWordBlur();
              }
            "
            @keydown="handleWordKeydown($event, idx)"
            :class="[
              'mr-1 outline-none border-none field-sizing-content',
              output &&
              output.words &&
              output.words[idx] &&
              output.words[idx].correction
                ? 'text-amber-500'
                : 'text-gray-800',
              idx === selected_word_index ? 'bg-blue-100 rounded px-1' : '',
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

    <!-- Translated Sentence Display -->

    <!-- Full Translated Sentence Display -->
    <div
      v-if="fullTranslatedSentence"
      class="mt-2 text-center text-lg text-blue-500"
    >
      {{ fullTranslatedSentence }}
      <!-- Spinner -->
      <span v-if="isTranslatingFullSentence" class="inline-block ml-2">
        <div
          class="inline-block w-1 h-1 bg-blue-500 rounded-full animate-bounce mr-1"
        ></div>
        <div
          class="inline-block w-1 h-1 bg-blue-500 rounded-full animate-bounce mr-1"
          style="animation-delay: 0.1s"
        ></div>
        <div
          class="inline-block w-1 h-1 bg-blue-500 rounded-full animate-bounce"
          style="animation-delay: 0.2s"
        ></div>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";
import SimpleTooltip from "./SimpleTooltip.vue";

const emit = defineEmits(["wordClick"]);

const props = defineProps({
  selected_word_index: {
    type: Number,
    default: null,
  },
});

const words = defineModel("words", {
  type: Array,
  default: () => [""],
});
const output = ref(false);
const selected_word_ref = ref(null);
const word_refs = ref([]);
const translate_input_ref = ref(null);
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
const isTranslatingFullSentence = ref(false);

async function checkSentence(sentence) {
  try {
    const res = await $fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: sentence,
      }),
    });
    output.value = res.result;
  } catch (e) {
    output.value = "";
  }
}

function handleWordKeydown(e, idx) {
  // Handle Tab key - toggle translate mode
  if (e.key === "Tab") {
    e.preventDefault();
    // Remove empty strings from words array
    words.value = words.value.filter((word) => word.trim() !== "");
    // If all words were empty, add back one empty string
    if (words.value.length === 0) {
      words.value.push("");
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
      const prevValue = words.value[prevIdx];
      words.value[prevIdx] = prevValue + e.target.value;
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
    const value = e.target.value;
    const start = e.target.selectionStart;
    const before = value.slice(0, start);
    const after = value.slice(start);
    words.value[idx] = before;
    words.value.splice(idx + 1, 0, after);
    nextTick(() => {
      word_refs.value[idx + 1]?.focus();
      if (word_refs.value[idx + 1]) {
        word_refs.value[idx + 1].selectionStart = 0;
        word_refs.value[idx + 1].selectionEnd = 0;
      }
    });
    // Translate the full sentence after adding word
    nextTick(() => {
      translateFullSentence();
      checkSentence(words.value.join(" "));
    });
    return;
  }

  if (e.key === "Space") {
    e.preventDefault();
    word_refs.value[idx - 1]?.focus();
    if (word_refs.value[idx - 1]) {
      word_refs.value[idx - 1].selectionStart = 0;
      word_refs.value[idx - 1].selectionEnd = 0;
    }
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
  selected_word_ref.value = null;
}

function applyCorrection(idx) {
  if (output.value && output.value.words) {
    const wordInfo = output.value.words[idx];
    if (wordInfo && wordInfo.correction) {
      words.value[idx] = wordInfo.correction;
      // Clear the correction so the word is no longer highlighted
      wordInfo.correction = null;
      // Optionally refocus the input
      nextTick(() => {
        word_refs.value[idx]?.focus();
      });
    }
  }
  checkSentence(words.value.join(" "));
}

function getTooltipText(word, idx) {
  if (!output.value || !output.value.words) {
    // If no output data for this word, just return empty or the word itself
    return "";
  }

  const trimmedWord = word.trim();
  const wordInfo = output.value.words.find((w) => w.word === trimmedWord);

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
  if (!output.value || !output.value.words) {
    return "translation";
  }

  const word = words.value[idx]?.trim();
  const wordInfo = output.value.words.find((w) => w.word === word);

  if (!wordInfo) {
    return "translation";
  }

  return wordInfo.correction ? "correction" : "translation";
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
    words.value.push("");
  }
  hideContextMenu();
}

function hideContextMenu() {
  contextMenu.value.visible = false;
}

async function translateFullSentence() {
  const sentence = words.value.join(" ").trim();
  if (!sentence) return;

  isTranslatingFullSentence.value = true;

  try {
    const res = await $fetch("/api/translate_sentence", {
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

  const sentence = words.value.join(" ");
  isTranslating.value = true;

  try {
    const res = await $fetch("/api/translate", {
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
      words.value.push(...translatedWords);

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

  // Recheck the sentence with new words
  checkSentence(words.value.join(" "));
}

async function handleTranslateKeydown(e) {
  // Handle Tab key to exit translate mode and translate words
  if (e.key === "Tab") {
    e.preventDefault();
    if (wordsToTranslate.value.trim()) {
      await translateAndAppendWords();
      await translateFullSentence();
    } else {
      translateMode.value = false;
    }
    return;
  }
  // Allow all other keys including spaces
}
</script>
