<template>
  <div
    class="grid grid-rows-[300,1fr] grid-cols-1 h-screen w-full"
    :class="isKeyboardVisible ? 'pb-32 sm:pb-36' : ''"
  >
    <div class="max-w-[800px] p-4 flex flex-col justify-center relative">
      <!-- Reset Button -->

      <button
        v-if="hasText"
        @click="clearAllText"
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
              inputmode="none"
              ref="word_refs"
              :placeholder="
                idx === 0 && words.length === 1 ? 'Start writing...' : ''
              "
              v-model="words[idx].text"
              autocapitalize="off"
              @input="handleWordInput($event)"
              @keydown="handleWordKeydown($event, idx)"
              @mousedown="handleWordMouseDown($event, word.text.trim(), idx)"
              @contextmenu="handleRightClick($event, idx)"
              @focus="handleWordFocus(idx)"
              @blur="handleWordBlur(idx)"
              :class="[
                'mr-1 outline-none border-none field-sizing-content  transition-all duration-200',
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
          inputmode="none"
          v-if="translateMode"
          ref="translate_input_ref"
          class="mr-1 outline-none border-none field-sizing-content text-2xl font-sans"
          :class="[
            isTranslating ? ' animate-pulse text-purple-500' : 'text-gray-500',
          ]"
          placeholder="words to translate..."
          v-model="wordsToTranslate"
          @keydown="handleTranslateKeydown($event)"
          @focus="handleTranslateFocus"
        />
      </div>

      <!-- Writing Topic CTA - Full width under input -->
      <div
        v-if="!words[0]?.text"
        class="mt-6 text-center transition-opacity duration-300"
        :class="
          words.length === 1 && !words[0]?.text
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
      <div
        v-if="fullTranslatedSentence"
        class="mt-8 mb-2 text-lg text-gray-500"
      >
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

      <!-- Mobile Translate Mode Button -->
      <button
        v-if="!isTranslatingMobile && words[0]?.text"
        class="md:hidden transition-all duration-300"
        :class="[
          'fixed px-4 py-3 bg-purple-100 text-purple-700 text-base font-semibold hover:bg-purple-200 transition-colors rounded-lg border border-purple-300 flex items-center justify-center gap-2 min-h-12',
          keyboardVisible
            ? 'bottom-4 left-4 right-4'
            : 'bottom-4 left-4 right-4',
        ]"
        @click="toggleTranslateMode"
      >
        <svg
          class="w-4 h-4 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          ></path>
        </svg>
        <span class="text-center leading-tight max-h-12 overflow-y-auto">{{
          translateMode ? "Accept" : "Translate Mode"
        }}</span>
      </button>
    </div>

    <!-- Virtual Keyboard Row -->
    <CustomKeyboard
      v-if="isKeyboardVisible"
      @onKeyPress="onKeyPress"
      @click="refocusCurrentInput"
      :input="currentInputValue"
      :caps-lock="isCapsLock"
      class="fixed bottom-0 left-0 right-0 w-screen z-50"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from "vue";
import SimpleTooltip from "./SimpleTooltip.vue";
import Loader from "./Loader.vue";
import CustomKeyboard from "./CustomKeyboard.vue";

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

const handleWordFocus = (idx) => {
  isKeyboardVisible.value = true;
  current_word_index.value = idx;
};

const handleWordBlur = (idx) => {
  // Keep keyboard visible when blurring, but don't change current_word_index
  // This allows keyboard to continue working if user clicks buttons
};
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
const previousWordIndex = ref(null);
const previousCursorPosition = ref(null);
const isCapsLock = ref(false);
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
const isTranslatingMobile = ref(false);
const translateInputFocused = ref(false);
const isKeyboardVisible = ref(false);
const originalViewportHeight = ref(0);

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

const hasText = computed(() => {
  return words.value.some((word) => word.text.trim() !== "");
});

const currentInputValue = computed(() => {
  if (
    current_word_index.value !== null &&
    current_word_index.value >= 0 &&
    current_word_index.value < words.value.length
  ) {
    return words.value[current_word_index.value]?.text || "";
  }
  return "";
});

function onChange(input) {
  if (
    current_word_index.value !== null &&
    current_word_index.value >= 0 &&
    current_word_index.value < words.value.length
  ) {
    // For individual key presses from CustomKeyboard, append the character
    if (input.length === 1) {
      words.value[current_word_index.value].text += input;
      handleWordInput({
        target: { value: words.value[current_word_index.value].text },
      });
    } else {
      // For full text replacement (from other keyboards)
      words.value[current_word_index.value].text = input;
      handleWordInput({ target: { value: input } });
    }
  }
  console.log("Input changed", input);

  // Refocus the current input after processing the key press
  nextTick(() => {
    if (
      current_word_index.value !== null &&
      current_word_index.value >= 0 &&
      current_word_index.value < words.value.length &&
      word_refs.value[current_word_index.value]
    ) {
      word_refs.value[current_word_index.value].focus();
    }
  });
}

function onKeyPress(button) {
  console.log("Button pressed", button);

  // Handle special keys
  if (button === "{space}") {
    if (
      current_word_index.value !== null &&
      current_word_index.value >= 0 &&
      current_word_index.value < words.value.length
    ) {
      const inputElement = word_refs.value[current_word_index.value];
      if (inputElement) {
        const start = inputElement.selectionStart || 0;
        const end = inputElement.selectionEnd || 0;
        const currentText = words.value[current_word_index.value].text;

        // Insert space at cursor position
        const newText =
          currentText.slice(0, start) + " " + currentText.slice(end);
        words.value[current_word_index.value].text = newText;

        // Update cursor position after the space
        nextTick(() => {
          if (inputElement) {
            const newCursorPos = start + 1;
            inputElement.selectionStart = newCursorPos;
            inputElement.selectionEnd = newCursorPos;
            inputElement.focus();
          }
        });

        // Trigger input handling which will split words on spaces
        handleWordInput({
          target: { value: words.value[current_word_index.value].text },
        });
      }
    }
  } else if (button === "{bksp}") {
    if (
      current_word_index.value !== null &&
      current_word_index.value >= 0 &&
      current_word_index.value < words.value.length
    ) {
      const inputElement = word_refs.value[current_word_index.value];
      if (inputElement) {
        const start = inputElement.selectionStart || 0;
        const end = inputElement.selectionEnd || 0;
        const currentText = words.value[current_word_index.value].text;

        if (start !== end) {
          // Text is selected, remove selection
          const newText = currentText.slice(0, start) + currentText.slice(end);
          words.value[current_word_index.value].text = newText;

          nextTick(() => {
            if (inputElement) {
              inputElement.selectionStart = start;
              inputElement.selectionEnd = start;
              inputElement.focus();
            }
          });
        } else if (start > 0) {
          // No selection, remove character before cursor
          const newText =
            currentText.slice(0, start - 1) + currentText.slice(start);
          words.value[current_word_index.value].text = newText;

          nextTick(() => {
            if (inputElement) {
              const newCursorPos = start - 1;
              inputElement.selectionStart = newCursorPos;
              inputElement.selectionEnd = newCursorPos;
              inputElement.focus();
            }
          });
        } else {
          // At beginning of word, merge with previous word if it exists
          const prevIdx = current_word_index.value - 1;
          if (prevIdx >= 0) {
            const prevValue = words.value[prevIdx].text;
            words.value[prevIdx] = {
              id: words.value[prevIdx].id,
              text: prevValue + currentText,
            };
            words.value.splice(current_word_index.value, 1);
            current_word_index.value = prevIdx;
            nextTick(() => {
              word_refs.value[prevIdx]?.focus();
              if (word_refs.value[prevIdx]) {
                word_refs.value[prevIdx].selectionStart = prevValue.length;
                word_refs.value[prevIdx].selectionEnd = prevValue.length;
              }
            });
          }
        }
      }
    }
  } else if (button === "{shift}") {
    // Toggle caps lock
    isCapsLock.value = !isCapsLock.value;
  } else if (button === "{translate}") {
    toggleTranslateMode();
  } else if (button === "{enter}") {
    if (translateMode.value) {
      // In translate mode, accept the translation but stay in translate mode
      if (wordsToTranslate.value.trim()) {
        translateAndAppendWords().then(() => {
          checkSentence();
          translateFullSentence();
        });
        // Don't exit translate mode - stay in translate mode to continue translating
      }
      // If no words to translate, do nothing (stay in translate mode)
    }
    // In normal mode, Enter doesn't do anything special
  } else {
    // Handle regular letter keys - insert at cursor position
    if (
      current_word_index.value !== null &&
      current_word_index.value >= 0 &&
      current_word_index.value < words.value.length
    ) {
      const inputElement = word_refs.value[current_word_index.value];
      if (inputElement) {
        const start = inputElement.selectionStart || 0;
        const end = inputElement.selectionEnd || 0;
        const currentText = words.value[current_word_index.value].text;

        // Insert the character at cursor position (apply caps lock if active)
        const charToInsert = isCapsLock.value ? button.toUpperCase() : button;
        const newText =
          currentText.slice(0, start) + charToInsert + currentText.slice(end);
        words.value[current_word_index.value].text = newText;

        // Update cursor position
        nextTick(() => {
          if (inputElement) {
            const newCursorPos = start + charToInsert.length;
            inputElement.selectionStart = newCursorPos;
            inputElement.selectionEnd = newCursorPos;
            inputElement.focus();
          }
        });

        console.log(
          "Updated word:",
          words.value[current_word_index.value].text
        );
        handleWordInput({
          target: { value: words.value[current_word_index.value].text },
        });
      }
    }
  }

  // Individual key handlers handle their own focus and cursor positioning
}

function generateWordId() {
  return "word-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
}

function refocusCurrentInput() {
  // Refocus the current input when keyboard is clicked
  nextTick(() => {
    if (
      current_word_index.value !== null &&
      current_word_index.value >= 0 &&
      current_word_index.value < words.value.length &&
      word_refs.value[current_word_index.value]
    ) {
      word_refs.value[current_word_index.value].focus();
    }
  });
}

function clearAllText() {
  words.value = [{ id: "first", text: "" }];
  output.value = { corrections: {} };
  sentenceErrors.value = null;
  fullTranslatedSentence.value = "";
  translateMode.value = false;
  wordsToTranslate.value = "";
  currentTopic.value = "";
}

function handleSpace(idx) {
  if (translateMode.value) {
    // In translate mode, allow spaces and enters normally
    return;
  }
  checkWord(words.value[idx], idx);
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

    // Only allow entering translate mode if there are actual words written
    if (
      !translateMode.value &&
      words.value.length === 1 &&
      !words.value[0].text.trim()
    ) {
      return; // Don't enter translate mode if no words are written
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

// function handleTranslateBlur() {
//   translateInputFocused.value = false;
// }

function handleWordInput(event) {
  const currentIdx = current_word_index.value;

  // Handle spaces immediately when they appear in input
  if (currentIdx !== null && words.value[currentIdx].text.includes(" ")) {
    const parts = words.value[currentIdx].text
      .split(/\s+/)
      .filter((word) => word.trim() !== "");
    if (parts.length > 1) {
      // Multiple words - split them
      words.value[currentIdx].text = parts[0];
      for (let i = 1; i < parts.length; i++) {
        words.value.splice(currentIdx + i, 0, {
          id: generateWordId(),
          text: parts[i],
        });
      }
      // Add empty input at the end
      words.value.splice(currentIdx + parts.length, 0, {
        id: generateWordId(),
        text: "",
      });
      nextTick(() => {
        word_refs.value[currentIdx + parts.length]?.focus();
      });
    } else {
      // Just one word followed by space(s) - create new empty input
      words.value[currentIdx].text = parts[0];
      handleSpace(currentIdx);
    }
    return;
  }

  if (checkTimeout.value) clearTimeout(checkTimeout.value);
  checkTimeout.value = setTimeout(() => {
    const currentIdx = current_word_index.value;
    // Check if all words are empty - if so, reset everything
    const allWordsEmpty = words.value.every((word) => !word.text.trim());
    if (allWordsEmpty) {
      output.value = { corrections: {} };
      sentenceErrors.value = null;
      fullTranslatedSentence.value = "";
      return;
    }
    checkWord(words.value[currentIdx], currentIdx);
    checkSentence();
    translateFullSentence();
  }, 500);
}

async function toggleTranslateMode() {
  if (translateMode.value) {
    // Accept: like pressing Tab in translate mode
    if (wordsToTranslate.value.trim()) {
      isTranslatingMobile.value = true;
      await translateAndAppendWords();
      await checkSentence();
      await translateFullSentence();
      isTranslatingMobile.value = false;
    } else {
      // Exit translate mode without adding words - just clear translate input
      translateMode.value = false;
      translateInputFocused.value = false;
      wordsToTranslate.value = "";

      // Restore focus to previous word input
      if (
        previousWordIndex.value !== null &&
        previousWordIndex.value >= 0 &&
        previousWordIndex.value < words.value.length
      ) {
        current_word_index.value = previousWordIndex.value;
        nextTick(() => {
          if (word_refs.value[previousWordIndex.value]) {
            word_refs.value[previousWordIndex.value].focus();
            if (previousCursorPosition.value !== null) {
              word_refs.value[previousWordIndex.value].selectionStart =
                previousCursorPosition.value;
              word_refs.value[previousWordIndex.value].selectionEnd =
                previousCursorPosition.value;
            }
          }
        });
      }
      // Keep existing words, don't reset them
    }
  } else {
    // Enter translate mode: like pressing Tab
    // Save current focus state before entering translate mode
    const wasInEmptyWord =
      current_word_index.value !== null &&
      current_word_index.value >= 0 &&
      current_word_index.value < words.value.length &&
      !words.value[current_word_index.value].text.trim();

    previousWordIndex.value = current_word_index.value;
    if (
      current_word_index.value !== null &&
      word_refs.value[current_word_index.value]
    ) {
      previousCursorPosition.value =
        word_refs.value[current_word_index.value].selectionStart;
    }

    words.value = words.value.filter((word) => word.text.trim() !== "");

    // If we were in an empty word, add it back and adjust the saved index
    if (wasInEmptyWord && words.value.length === 0) {
      words.value.push({ id: "first", text: "" });
      previousWordIndex.value = 0;
    } else if (wasInEmptyWord) {
      // Add empty word at the end and update the saved index
      words.value.push({ id: generateWordId(), text: "" });
      previousWordIndex.value = words.value.length - 1;
    }

    // If all words were empty, add back one empty string
    if (words.value.length === 0) {
      words.value.push({ id: "first", text: "" });
    }

    // If current word has text, create a new empty word and focus on it
    const currentIdx = current_word_index.value;
    if (
      currentIdx !== null &&
      currentIdx >= 0 &&
      currentIdx < words.value.length
    ) {
      const currentWord = words.value[currentIdx];
      if (currentWord && currentWord.text.trim() !== "") {
        // Current word has text, create a new empty word
        words.value.splice(currentIdx + 1, 0, {
          id: generateWordId(),
          text: "",
        });
        current_word_index.value = currentIdx + 1;
        nextTick(() => {
          word_refs.value[currentIdx + 1]?.focus();
        });
      }
    }

    // Allow entering translate mode even with no words written
    translateMode.value = true;
    nextTick(() => {
      translate_input_ref.value?.focus();
    });
  }
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

  // Adjust current_word_index after deletion
  if (current_word_index.value !== null) {
    if (wordIndex === current_word_index.value) {
      // Deleted the current word, move to previous or null
      current_word_index.value = wordIndex > 0 ? wordIndex - 1 : null;
    } else if (wordIndex < current_word_index.value) {
      // Deleted a word before current, shift index down
      current_word_index.value--;
    }
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

      // Clear previous position since we've successfully added words
      previousWordIndex.value = null;
      previousCursorPosition.value = null;
    }
  } catch (e) {
    console.error("Translation failed:", e);
  } finally {
    isTranslating.value = false;
  }

  // Clear translate input and exit translate mode
  wordsToTranslate.value = "";
  translateMode.value = false;
  translateInputFocused.value = false;
}

async function handleTranslateKeydown(e) {
  // Handle Tab or Enter key to exit translate mode and translate words
  if (e.key === "Tab" || e.key === "Enter") {
    e.preventDefault();
    if (wordsToTranslate.value.trim()) {
      await translateAndAppendWords();

      await checkSentence();
      await translateFullSentence();
    } else {
      translateMode.value = false;
      translateInputFocused.value = false;
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

/* Keyboard visibility adjustments for mobile */
.keyboard-visible {
  position: fixed !important;
  top: 20px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  width: 100% !important;
  max-width: 800px !important;
  z-index: 1000 !important;
}
</style>
