<template>
  <div
    class="select-none border-t border-gray-200 p-2 sm:p-4 rounded-t-xl shadow-lg w-full max-w-none"
  >
    <div class="flex flex-row w-full gap-1 mb-1 sm:mb-2 relative">
      <KeyboardKey
        v-for="key in ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']"
        :key="'key-' + key"
        :keyValue="keyboardState.isCapsLock ? key : key.toLowerCase()"
        :pressed="pressedKeys.has(key)"
        :buttonClass="[
          'keyboard-key flex-1 min-w-0 bg-gray-50 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-colors duration-75 border border-gray-300 shadow-sm',
          pressedKeys.has(key) ? 'bg-gray-200' : '',
        ]"
        @press="handleKeyDown"
        @release="handleKeyUp"
      >
        {{ keyboardState.isCapsLock ? key : key.toLowerCase() }}
      </KeyboardKey>
    </div>

    <div class="flex flex-row w-full gap-1 mb-1 sm:mb-2 pl-4 pr-4 relative">
      <span class="flex-[0.5]" />
      <KeyboardKey
        v-for="key in ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']"
        :key="'key-' + key"
        :keyValue="keyboardState.isCapsLock ? key : key.toLowerCase()"
        :pressed="pressedKeys.has(key)"
        :buttonClass="[
          'keyboard-key flex-1 min-w-0 bg-gray-50 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
          pressedKeys.has(key) ? 'bg-gray-200' : '',
        ]"
        @press="handleKeyDown"
        @release="handleKeyUp"
      >
        {{ keyboardState.isCapsLock ? key : key.toLowerCase() }}
      </KeyboardKey>
      <span class="flex-[0.5]" />
    </div>

    <!-- Third row: ZXCVBNM and special keys -->
    <div class="flex flex-row w-full gap-1 mb-1 sm:mb-2 relative">
      <KeyboardKey
        key="key-shift"
        keyValue="Shift"
        :pressed="pressedKeys.has('Shift')"
        :buttonClass="[
          'keyboard-key flex-[1.5] min-w-0 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border shadow-sm',
          keyboardState.isCapsLock
            ? 'bg-gray-800 active:bg-black text-white border-gray-600'
            : 'bg-gray-100 active:bg-gray-300 text-gray-700 border-gray-300',
          pressedKeys.has('Shift') ? 'bg-gray-400' : '',
        ]"
        @press="handleShiftPress"
        @release="handleShiftRelease"
      >
        <div class="flex items-center justify-center">
          <span
            v-if="isPermanentCaps"
            class="text-lg transform scale-x-125 text-white"
            >⇪</span
          >
          <span
            v-else
            :class="keyboardState.isCapsLock ? 'text-white' : ''"
            class="text-lg"
            >⇧</span
          >
        </div>
      </KeyboardKey>
      <KeyboardKey
        v-for="key in ['Z', 'X', 'C', 'V', 'B', 'N', 'M']"
        :key="'key-' + key"
        :keyValue="keyboardState.isCapsLock ? key : key.toLowerCase()"
        :pressed="pressedKeys.has(key)"
        :buttonClass="[
          'keyboard-key flex-1 min-w-0 bg-gray-50 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
          pressedKeys.has(key) ? 'bg-gray-200' : '',
        ]"
        @press="handleKeyDown"
        @release="handleKeyUp"
      >
        {{ keyboardState.isCapsLock ? key : key.toLowerCase() }}
      </KeyboardKey>
      <KeyboardKey
        key="key-backspace"
        keyValue="Backspace"
        :pressed="pressedKeys.has('Backspace')"
        :buttonClass="[
          'keyboard-key flex-[1.5] min-w-0 bg-gray-100 text-gray-700 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
          pressedKeys.has('Backspace') ? 'bg-gray-300' : '',
        ]"
        @press="handleKeyDown"
        @release="handleKeyUp"
      >
        ⌫
      </KeyboardKey>
    </div>

    <!-- Fourth row: Space and Enter -->
    <div class="flex flex-row w-full gap-1 relative">
      <KeyboardKey
        key="key-tab"
        keyValue="Tab"
        :pressed="pressedKeys.has('Tab')"
        :buttonClass="[
          'keyboard-key w-full font-medium py-3 sm:py-4 rounded-md transition-all duration-150 border shadow-sm flex items-center justify-center',
          props.translateMode
            ? 'bg-purple-300 text-purple-900 border-purple-400'
            : 'bg-purple-100 text-purple-700 border-purple-300',
        ]"
        style="flex: 1.2 1 0%"
        @press="handleKeyDown"
        @release="handleKeyUp"
      >
        <template v-if="isTranslating">
          <svg
            class="h-6 w-6 shrink-0 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </template>
        <template
          v-else-if="props.translateMode && props.wordsToTranslate.length > 0"
        >
          <svg
            class="h-6 w-6 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </template>
        <template v-else>
          <svg
            class="h-6 w-6 shrink-0"
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
        </template>
      </KeyboardKey>
      <KeyboardKey
        key="key-comma"
        keyValue=","
        :pressed="pressedKeys.has(',')"
        :buttonClass="[
          'keyboard-key w-full bg-gray-50 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
          pressedKeys.has(',') ? 'bg-gray-200' : '',
        ]"
        style="flex: 1 1 0%"
        @press="handleKeyDown"
        @release="handleKeyUp"
      >
        ,
      </KeyboardKey>
      <KeyboardKey
        key="key-space"
        keyValue=" "
        :pressed="pressedKeys.has(' ')"
        :buttonClass="[
          'keyboard-key w-full bg-gray-50 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
          pressedKeys.has(' ') ? 'bg-gray-200' : '',
        ]"
        style="flex: 5 1 0%"
        @press="handleKeyDown"
        @release="handleKeyUp"
      >
        Space
      </KeyboardKey>
      <KeyboardKey
        key="key-dot"
        keyValue="."
        :pressed="pressedKeys.has('.')"
        :buttonClass="[
          'keyboard-key w-full bg-gray-50 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
          pressedKeys.has('.') ? 'bg-gray-200' : '',
        ]"
        style="flex: 1 1 0%"
        @press="handleKeyDown"
        @release="handleKeyUp"
      >
        .
      </KeyboardKey>
      <KeyboardKey
        key="key-enter"
        keyValue="Enter"
        :pressed="pressedKeys.has('Enter')"
        :buttonClass="[
          'keyboard-key w-full bg-gray-100 text-gray-700 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
          pressedKeys.has('Enter') ? 'bg-gray-300' : '',
        ]"
        style="flex: 1.2 1 0%"
        @press="handleKeyDown"
        @release="handleKeyUp"
      >
        Enter
      </KeyboardKey>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useKeyboard } from "~/composables/useKeyboard";

const props = defineProps({
  isTranslating: {
    type: Boolean,
    default: false,
  },
  translateMode: {
    type: Boolean,
    default: false,
  },
  wordsToTranslate: {
    type: String,
    default: "",
  },
});
const pressedKeys = ref(new Set());
const deleteInterval = ref(null);
const deleteTimeout = ref(null);
const deleteSpeedUpTimeout = ref(null);
const hasAddedTextInTranslateMode = ref(false);
const isPermanentCaps = ref(false);
const shiftTimeout = ref(null);
const { state: keyboardState, actions: keyboardActions } = useKeyboard();

const emit = defineEmits(["on-key-press"]);

function handleKeyDown(key) {
  // Trigger vibration if supported
  if ("vibrate" in navigator) {
    navigator.vibrate(10);
  }
  // Normalize letter keys to uppercase for consistent pressed state tracking
  const normalizedKey =
    key.length === 1 && /[a-zA-Z]/.test(key) ? key.toUpperCase() : key;
  pressedKeys.value.add(normalizedKey);
  keyboardActions.pressKey(key);

  if (key === "Backspace") {
    // Clear any existing timers
    if (deleteTimeout.value) clearTimeout(deleteTimeout.value);
    if (deleteInterval.value) clearInterval(deleteInterval.value);
    if (deleteSpeedUpTimeout.value) clearTimeout(deleteSpeedUpTimeout.value);

    // Start repeat deletion after 250ms
    deleteTimeout.value = setTimeout(() => {
      deleteInterval.value = setInterval(() => {
        if (pressedKeys.value.has("Backspace")) {
          emit("on-key-press", key);
        }
      }, 100); // Initial speed: 100ms per deletion

      // Speed up after 2 seconds
      deleteSpeedUpTimeout.value = setTimeout(() => {
        clearInterval(deleteInterval.value);
        deleteInterval.value = setInterval(() => {
          if (pressedKeys.value.has("Backspace")) {
            emit("on-key-press", key);
          }
        }, 50); // Faster speed: 50ms per deletion
      }, 2000);
    }, 250);
  } else {
    emit("on-key-press", key);
  }

  // If caps lock is on and not permanent, and a letter was pressed, turn it off
  if (
    !isPermanentCaps.value &&
    keyboardState.value.isCapsLock &&
    key.length === 1 &&
    /[a-zA-Z]/.test(key)
  ) {
    keyboardState.value.isCapsLock = false;
  }
}

function handleShiftPress() {
  if (keyboardState.value.isCapsLock) {
    // If caps lock is on, turn it off
    keyboardState.value.isCapsLock = false;
    isPermanentCaps.value = false;
  } else {
    // If caps lock is off, turn it on (sticky shift)
    keyboardState.value.isCapsLock = true;
    // Trigger vibration when sticky shift is activated
    if ("vibrate" in navigator) {
      navigator.vibrate(20);
    }
    // Long press: turn on permanent caps
    shiftTimeout.value = setTimeout(() => {
      isPermanentCaps.value = true;
      // Trigger vibration when permanent caps is activated
      if ("vibrate" in navigator) {
        navigator.vibrate(20); // Single vibration
      }
    }, 500);
  }
}

function handleShiftRelease() {
  if (shiftTimeout.value) {
    clearTimeout(shiftTimeout.value);
    shiftTimeout.value = null;
  }
}

function handleKeyUp(key) {
  // Normalize letter keys to uppercase for consistent pressed state tracking
  const normalizedKey =
    key.length === 1 && /[a-zA-Z]/.test(key) ? key.toUpperCase() : key;
  pressedKeys.value.delete(normalizedKey);

  if (key === "Backspace") {
    // Emit one more backspace on release
    emit("on-key-press", key);

    // Clear all backspace repeat timers
    if (deleteTimeout.value) {
      clearTimeout(deleteTimeout.value);
      deleteTimeout.value = null;
    }
    if (deleteInterval.value) {
      clearInterval(deleteInterval.value);
      deleteInterval.value = null;
    }
    if (deleteSpeedUpTimeout.value) {
      clearTimeout(deleteSpeedUpTimeout.value);
      deleteSpeedUpTimeout.value = null;
    }
  }
}
</script>

<style scoped>
.keyboard-key {
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  z-index: 1;
}

.keyboard-key:active {
  transform: scale(0.98);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
