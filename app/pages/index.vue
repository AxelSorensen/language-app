<template>
  <BaseLayout>
    <template #header>
      <LanguageSelector @languageChange="handleLanguageChange" />

      <button
        @click="wordsActions.reset()"
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
    </template>

    <template #content>
      <div class="flex relative items-center h-full">
        <div class="mx-auto">
          <InputWords ref="inputWordsRef" @wordClick="handleWordClick" />
        </div>
      </div>
    </template>

    <template #keyboard>
      <CustomKeyboard
        :is-translating="translateModeState.isTranslating"
        @on-key-press="handleKeyPress"
      />
    </template>
  </BaseLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import InputWords from "~/components/InputWords.vue";
import LanguageSelector from "~/components/LanguageSelector.vue";
import ScreenSizeWidget from "~/components/ScreenSizeWidget.vue";
import WordSidebar from "~/components/WordSidebar.vue";
import CustomKeyboard from "~/components/CustomKeyboard.vue";
import BaseLayout from "~/layouts/BaseLayout.vue";
import { LanguageService } from "~/services/LanguageService";
import { useTranslateMode } from "~/composables/useTranslateMode";

definePageMeta({
  layout: "keyboard",
});

const sidebarOpen = ref(false);
const selected_word_index = ref(null);
const sentences = ref([]);
const wordInfo = ref(null);
const languages = ref({
  source: "en",
  target: "es",
});

const {
  state: wordsState,
  actions: wordsActions,
  computed: wordsComputed,
  refs: wordsRefs,
} = useWords();

// ...existing code...
// Helper: get all word input elements (assuming they have a data-word-index attribute)
function getWordInputByIndex(idx) {
  return document.querySelector(`input[data-word-index="${idx}"]`);
}

// Helper: focus an input element
function focusInput(input) {
  if (input && typeof input.focus === "function") {
    input.focus();
    return input;
  }
  return null;
}

// Listen for focus events on word inputs to update selected_word_index
function handleInputFocus(e) {
  const idx = e.target.getAttribute("data-word-index");
  if (idx !== null) {
    selected_word_index.value = Number(idx);
  }
}

// Keyboard state

function handleLanguageChange(newLanguages) {
  languages.value = newLanguages;
}

async function handleWordClick(idx) {
  selected_word_index.value = idx;
  sidebarOpen.value = true;

  // Fetch example sentences for the selected word
  try {
    const response = await $fetch("/api/sentences", {
      method: "POST",
      body: {
        word: words.value[idx].text.trim(),
        sentence: words.value.map((w) => w.text).join(" "),
      },
    });
    sentences.value = response.result.sentences || [];
  } catch (error) {
    console.error("Failed to fetch sentences:", error);
    sentences.value = [];
  }

  // Fetch additional word information
  try {
    const response = await $fetch("/api/word-info", {
      method: "POST",
      body: {
        word: words.value[idx].text.trim(),
        sentence: words.value.map((w) => w.text).join(" "),
      },
    });
    wordInfo.value = response.result || null;
  } catch (error) {
    console.error("Failed to fetch word info:", error);
    wordInfo.value = null;
  }
}

function closeSidebar() {
  sidebarOpen.value = false;
  selected_word_index.value = null;
  sentences.value = [];
  wordInfo.value = null;
}

const { state: translateModeState, actions: translateActions } =
  useTranslateMode();

async function handleSpaceBar(e, isCustom) {
  // Prevent spacebar handling during translation mode to avoid interfering with text input
  if (translateModeState.value.translateMode) {
    return;
  }
  e.preventDefault();
  const idx = wordsState.value.current_input_index;
  const currentWord = wordsState.value.words?.[idx];
  const word = currentWord?.text || "";

  if (word.trim() !== "") {
    const currentInput = wordsRefs.value?.[idx];
    if (!currentInput) return;

    // Prevent accidental word splitting when cursor is at word start
    if (currentInput.selectionStart === 0) {
      return;
    }

    const cursorAtEnd = currentInput.selectionStart === word.length;

    // Split word at cursor when typing in middle - enables precise word editing
    if (!cursorAtEnd && currentInput.selectionStart > 0) {
      const beforeCursor = word.slice(0, currentInput.selectionStart);
      const afterCursor = word.slice(currentInput.selectionStart);

      currentWord.text = beforeCursor;
      wordsActions.addWords(idx + 1, [afterCursor]);

      await nextTick();
      const newInput = wordsRefs.value?.[idx + 1];
      if (newInput) {
        newInput.focus();
        newInput.selectionStart = newInput.selectionEnd = 0;
      }
    } else {
      // Create new word when at end - standard word separation behavior
      wordsActions.addWord(idx);
      try {
        await LanguageService.processWord(word, languages.value.target);
      } catch (err) {
        console.error("Word check failed:", err);
      }
    }
  }
}

function handleEnter(e, isVirtualKeyboard) {
  // Prevent default behavior for physical keyboard, allow virtual keyboard to handle
  if (!isVirtualKeyboard) e.preventDefault();
}

function handleShift(e, isVirtualKeyboard) {
  e.preventDefault();
  // Toggle caps lock state for case-sensitive typing
  const { actions: keyboardActions } = useKeyboard();
  keyboardActions.toggleCapsLock();
}

function handleBackspace(e, isVirtualKeyboard) {
  // Virtual keyboard needs manual text manipulation since it doesn't trigger native events
  if (isVirtualKeyboard) {
    const input = translateModeState.value.translateMode
      ? inputWordsRef.value?.translate_input_ref
      : wordsRefs.value?.[wordsState.value.current_input_index];
    const focusedInput = focusInput(input);
    if (focusedInput) {
      const start = focusedInput.selectionStart || 0;
      const end = focusedInput.selectionEnd || 0;
      const value = focusedInput.value || "";
      // Delete selected text or previous character for virtual keyboard
      if (start !== end) {
        focusedInput.value = value.slice(0, start) + value.slice(end);
        focusedInput.selectionStart = focusedInput.selectionEnd = start;
      } else if (start > 0) {
        focusedInput.value = value.slice(0, start - 1) + value.slice(start);
        focusedInput.selectionStart = focusedInput.selectionEnd = start - 1;
      }
      focusedInput.dispatchEvent(new Event("input", { bubbles: true }));
      focusedInput.focus();
    }
  }

  // Skip word-level operations during translation mode
  if (translateModeState.value.translateMode) {
    return;
  }

  const currentInput = wordsRefs.value?.[wordsState.value.current_input_index];
  const currentWord =
    wordsState.value.words[wordsState.value.current_input_index];

  // Handle text selection - delete selected text before other operations
  if (
    currentInput &&
    currentInput.selectionStart !== currentInput.selectionEnd
  ) {
    e.preventDefault();
    const start = currentInput.selectionStart;
    const end = currentInput.selectionEnd;
    const value = currentInput.value;

    currentWord.text = value.slice(0, start) + value.slice(end);
    currentInput.value = currentWord.text;
    currentInput.selectionStart = currentInput.selectionEnd = start;
    currentInput.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  // Remove empty words only when backspace is pressed at the beginning of an empty word
  if (
    currentWord?.text === "" &&
    wordsState.value.words.length > 1 &&
    currentInput &&
    currentInput.selectionStart === 0 &&
    currentInput.selectionEnd === 0
  ) {
    e.preventDefault();
    wordsActions.deleteWord(wordsState.value.current_input_index);
    const input = focusInput(
      wordsRefs.value?.[wordsState.value.current_input_index - 1]
    );
  } else if (
    currentInput &&
    currentInput.selectionStart === 0 &&
    wordsState.value.current_input_index > 0
  ) {
    // Merge words when backspacing at start - enables seamless word joining
    e.preventDefault();
    const prevIndex = wordsState.value.current_input_index - 1;
    const prevWord = wordsState.value.words[prevIndex];
    const currentWord =
      wordsState.value.words[wordsState.value.current_input_index];

    const prevWordLength = prevWord.text.length;
    prevWord.text += currentWord.text;
    wordsActions.deleteWord(wordsState.value.current_input_index);

    const prevInput = wordsRefs.value?.[prevIndex];
    if (prevInput) {
      prevInput.focus();
      setTimeout(() => {
        prevInput.selectionStart = prevInput.selectionEnd = prevWordLength;
      }, 0);
    }
  }
}

const inputWordsRef = ref(null);

async function handleTab(e) {
  e.preventDefault();
  const idx = wordsState.value.current_input_index;
  const currentWord = wordsState.value.words?.[idx]?.text || "";
  // Clean up empty words before switching modes
  if (currentWord.trim() !== "") {
  } else {
    wordsActions.deleteWord(idx);
  }
  // Toggle between writing and translation modes
  translateModeState.value.translateMode =
    !translateModeState.value.translateMode;
  if (translateModeState.value.translateMode) {
    await nextTick();
    if (inputWordsRef.value?.translate_input_ref) {
      inputWordsRef.value.translate_input_ref.focus();
    }
    return;
  }

  // Handle translation response and add translated words
  if (!translateModeState.value.wordsToTranslate) {
    if (!wordsState.value.words.length) {
      wordsActions.addWord(0);
    }
    nextTick(() => {
      focusInput(wordsRefs.value?.[wordsState.value.words.length - 1]);
    });
    return;
  }

  const response = await translateActions.translate(
    translateModeState.value.wordsToTranslate
  );
  console.log("Translation response:", response);

  const translatedText = response.translation;
  const words = translatedText.split(" ").filter((word) => word.trim() !== "");
  if (words.length > 0) {
    wordsActions.addWords(wordsState.value.words.length, words);
  }
}

function handleArrowLeft(e, isVirtualKeyboard) {
  // Skip navigation during translation mode to avoid interfering with text input
  if (translateModeState.value.translateMode) {
    return;
  }

  const currentInput = wordsRefs.value?.[wordsState.value.current_input_index];
  if (!currentInput) return;

  // Navigate to previous word when at start - enables word-level navigation
  if (
    currentInput.selectionStart === 0 &&
    wordsState.value.current_input_index > 0
  ) {
    e.preventDefault();
    const prevIndex = wordsState.value.current_input_index - 1;
    const prevInput = wordsRefs.value?.[prevIndex];
    if (prevInput) {
      prevInput.focus();
      setTimeout(() => {
        prevInput.selectionStart = prevInput.selectionEnd =
          prevInput.value.length;
      }, 0);
    }
  }
  // Default browser behavior handles cursor movement within current word
}

function handleArrowRight(e, isVirtualKeyboard) {
  // Skip navigation during translation mode to avoid interfering with text input
  if (translateModeState.value.translateMode) {
    return;
  }

  const currentInput = wordsRefs.value?.[wordsState.value.current_input_index];
  if (!currentInput) return;

  const currentWord =
    wordsState.value.words?.[wordsState.value.current_input_index];
  const word = currentWord?.text || "";

  // Navigate to next word when at end - enables word-level navigation
  if (
    currentInput.selectionStart === word.length &&
    wordsState.value.current_input_index < wordsState.value.words.length - 1
  ) {
    e.preventDefault();
    const nextIndex = wordsState.value.current_input_index + 1;
    const nextInput = wordsRefs.value?.[nextIndex];
    if (nextInput) {
      nextInput.focus();
      setTimeout(() => {
        nextInput.selectionStart = nextInput.selectionEnd = 0;
      }, 0);
    }
  }
  // Default browser behavior handles cursor movement within current word
}

function handleKeyboardEvent(e) {
  const isVirtualKeyboard = e.type === "custom-keyboard-event";
  let key = e.key;

  // Route different key types to specialized handlers for proper behavior
  if (key === "{space}" || key === " ") {
    handleSpaceBar(e, isVirtualKeyboard);
    return;
  } else if (key === "Enter" || key === "{enter}") {
    handleEnter(e, isVirtualKeyboard);
    return;
  } else if (key === "Shift" || key === "{shift}") {
    handleShift(e, isVirtualKeyboard);
    return;
  } else if (key === "Backspace" || key === "{backspace}") {
    handleBackspace(e, isVirtualKeyboard);
    return;
  } else if (key === "Tab" || key === "{tab}") {
    handleTab(e, isVirtualKeyboard);
    return;
  } else if (key === "ArrowLeft") {
    handleArrowLeft(e, isVirtualKeyboard);
    return;
  } else if (key === "ArrowRight") {
    handleArrowRight(e, isVirtualKeyboard);
    return;
  }

  // Handle regular character input for virtual keyboard
  if (isVirtualKeyboard) {
    const input = translateModeState.value.translateMode
      ? inputWordsRef.value?.translate_input_ref
      : wordsRefs.value?.[wordsState.value.current_input_index];
    const focusedInput = focusInput(input);
    if (focusedInput) {
      const start = focusedInput.selectionStart || 0;
      const end = focusedInput.selectionEnd || 0;
      const value = focusedInput.value || "";
      focusedInput.value = value.slice(0, start) + key + value.slice(end);
      focusedInput.selectionStart = focusedInput.selectionEnd =
        start + key.length;
      focusedInput.dispatchEvent(new Event("input", { bubbles: true }));
      focusedInput.focus();
    }
  }
}

onMounted(() => {
  document.addEventListener("custom-keyboard-event", handleKeyboardEvent);
  document.addEventListener("keydown", handleKeyboardEvent);
  onBeforeUnmount(() => {
    document.removeEventListener("custom-keyboard-event", handleKeyboardEvent);
    document.removeEventListener("keydown", handleKeyboardEvent);
  });
});
</script>
