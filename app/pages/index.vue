<template>
  <BaseLayout>
    <template #header>
      <LanguageSelector @languageChange="handleLanguageChange" />
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

const { translateMode, wordsToTranslate } = useTranslateMode();

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
  if (translateModeState.value.translateMode) {
    return; // Do not handle backspace in translate mode
  }
  e.preventDefault();
  const idx = wordsState.value.current_input_index;
  const currentWord = wordsState.value.words?.[idx];
  const word = currentWord?.text || "";

  if (word.trim() !== "") {
    // Check if we're in the middle of a word (cursor not at the end)
    const currentInput = wordsRefs.value?.[idx];
    const cursorAtEnd =
      !currentInput || currentInput.selectionStart === word.length;

    if (!cursorAtEnd && currentInput.selectionStart > 0) {
      // Split the word at cursor position
      const beforeCursor = word.slice(0, currentInput.selectionStart);
      const afterCursor = word.slice(currentInput.selectionStart);

      // Update current word to text before cursor
      currentWord.text = beforeCursor;

      // Insert new word with text after cursor
      wordsActions.addWords(idx + 1, [afterCursor]);

      // Focus on the new word at the beginning
      await nextTick();
      const newInput = wordsRefs.value?.[idx + 1];
      if (newInput) {
        newInput.focus();
        newInput.selectionStart = newInput.selectionEnd = 0;
      }
    } else {
      // Normal behavior: add new word
      wordsActions.addWord(idx);
      // Call LanguageService to check the word after adding
      try {
        await LanguageService.processWord(word, languages.value.target);
        // Optionally handle the result here (e.g., update UI, show feedback)
      } catch (err) {
        console.error("Word check failed:", err);
      }
    }
  }
}

function handleEnter(e, isVirtualKeyboard) {
  // You can handle enter here if needed
  if (!isVirtualKeyboard) e.preventDefault();
}

function handleShift(e, isVirtualKeyboard) {
  e.preventDefault();
  const { actions: keyboardActions } = useKeyboard();
  keyboardActions.toggleCapsLock();
}

function handleBackspace(e, isVirtualKeyboard) {
  if (isVirtualKeyboard) {
    const input = translateModeState.value.translateMode
      ? inputWordsRef.value?.translate_input_ref
      : wordsRefs.value?.[wordsState.value.current_input_index];
    const focusedInput = focusInput(input);
    if (focusedInput) {
      const start = focusedInput.selectionStart || 0;
      const end = focusedInput.selectionEnd || 0;
      const value = focusedInput.value || "";
      if (start !== end) {
        // Delete selection
        focusedInput.value = value.slice(0, start) + value.slice(end);
        focusedInput.selectionStart = focusedInput.selectionEnd = start;
      } else if (start > 0) {
        // Delete previous character
        focusedInput.value = value.slice(0, start - 1) + value.slice(start);
        focusedInput.selectionStart = focusedInput.selectionEnd = start - 1;
      }
      focusedInput.dispatchEvent(new Event("input", { bubbles: true }));
      focusedInput.focus();
    }
  }

  if (translateModeState.value.translateMode) {
    return; // Do not handle backspace in translate mode for physical keyboard
  }

  const currentInput = wordsRefs.value?.[wordsState.value.current_input_index];
  const currentWord =
    wordsState.value.words[wordsState.value.current_input_index];

  if (currentWord?.text === "" && wordsState.value.words.length > 1) {
    // If current word is empty, remove it and move to previous
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
    // If cursor is at the beginning of a non-empty word, merge with previous word
    e.preventDefault();
    const prevIndex = wordsState.value.current_input_index - 1;
    const prevWord = wordsState.value.words[prevIndex];
    const currentWord =
      wordsState.value.words[wordsState.value.current_input_index];

    // Store the length of the previous word before merging
    const prevWordLength = prevWord.text.length;

    // Merge the current word text to the previous word
    prevWord.text += currentWord.text;

    // Remove the current word
    wordsActions.deleteWord(wordsState.value.current_input_index);

    // Focus on the previous word at the position where the words were merged
    const prevInput = wordsRefs.value?.[prevIndex];
    if (prevInput) {
      prevInput.focus();
      // Use setTimeout to ensure focus is set before setting selection
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
  if (currentWord.trim() !== "") {
  } else {
    wordsActions.deleteWord(idx);
  }
  translateModeState.value.translateMode =
    !translateModeState.value.translateMode;
  if (translateModeState.value.translateMode) {
    await nextTick();
    if (inputWordsRef.value?.translate_input_ref) {
      inputWordsRef.value.translate_input_ref.focus();
    }
    return;
  }

  if (!translateModeState.value.wordsToTranslate) {
    // Add back an empty word where it was deleted
    wordsActions.addWord(idx - 1);
    focusInput(wordsRefs.value?.[wordsState.value.words.length - 1]);
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

function handleKeyboardEvent(e) {
  const isVirtualKeyboard = e.type === "custom-keyboard-event";
  let key = e.key;

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
  }

  // Only manually insert characters for custom keyboard events
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
