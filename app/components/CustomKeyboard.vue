<template>
  <div
    class="custom-keyboard select-none bg-white border-t border-gray-200 p-2 sm:p-4 rounded-t-xl shadow-lg w-full max-w-none"
  >
    <div class="flex flex-row w-full gap-1 mb-1 sm:mb-2 relative">
      <div
        v-for="(key, index) in [
          'Q',
          'W',
          'E',
          'R',
          'T',
          'Y',
          'U',
          'I',
          'O',
          'P',
        ]"
        :key="'container-' + key"
        class="relative flex-1"
      >
        <button
          @focus.prevent
          tabindex="-1"
          :class="[
            'keyboard-key w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-colors duration-75 border border-gray-300 shadow-sm',
            pressedKeys.has(key) ? 'bg-gray-200 pressed' : '',
          ]"
        >
          {{ capsLock ? key : key.toLowerCase() }}
        </button>
        <!-- Hitbox -->
        <div
          @touchstart.prevent="handleKeyDown(key)"
          @mousedown="handleKeyDown(key)"
          @touchend="handleKeyUp(key)"
          @mouseup="handleKeyUp(key)"
          class="absolute inset-0 opacity-0 rounded-md cursor-pointer"
          style="margin: -4px; z-index: 10"
        ></div>
      </div>
    </div>

    <div class="flex flex-row w-full gap-1 mb-1 sm:mb-2 pl-4 pr-4 relative">
      <span class="flex-[0.5]" />
      <div
        v-for="key in ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']"
        :key="'container-' + key"
        class="relative flex-1"
      >
        <button
          @focus.prevent
          tabindex="-1"
          :class="[
            'keyboard-key w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
            pressedKeys.has(key) ? 'bg-gray-200 pressed' : '',
          ]"
        >
          {{ capsLock ? key : key.toLowerCase() }}
        </button>
        <!-- Hitbox -->
        <div
          @touchstart.prevent="handleKeyDown(key)"
          @mousedown="handleKeyDown(key)"
          @touchend="handleKeyUp(key)"
          @mouseup="handleKeyUp(key)"
          class="absolute inset-0 opacity-0 rounded-md cursor-pointer"
          :style="`margin: -4px; ${key === 'A' ? 'margin-left: -30px;' : ''} ${
            key === 'L' ? 'margin-right: -30px;' : ''
          } z-index: 10`"
        ></div>
      </div>
      <span class="flex-[0.5]" />
    </div>

    <!-- Third row: ZXCVBNM and special keys -->
    <div class="flex flex-row w-full gap-1 mb-1 sm:mb-2 relative">
      <div class="relative flex-[1.2]">
        <button
          @focus.prevent
          tabindex="-1"
          :class="[
            'keyboard-key w-full font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border shadow-sm',
            capsLock
              ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900 border-gray-400'
              : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 border-gray-300',
            pressedKeys.has('{shift}') ? 'bg-gray-400 pressed' : '',
          ]"
        >
          ⇧
        </button>
        <!-- Hitbox -->
        <div
          @touchstart.prevent="handleKeyDown('{shift}')"
          @mousedown="handleKeyDown('{shift}')"
          @touchend="handleKeyUp('{shift}')"
          @mouseup="handleKeyUp('{shift}')"
          class="absolute inset-0 opacity-0 rounded-md cursor-pointer"
          style="margin: -4px; z-index: 10"
        ></div>
      </div>
      <div
        v-for="key in ['Z', 'X', 'C', 'V', 'B', 'N', 'M']"
        :key="'container-' + key"
        class="relative flex-1"
      >
        <button
          @focus.prevent
          tabindex="-1"
          :class="[
            'keyboard-key w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
            pressedKeys.has(key) ? 'bg-gray-200 pressed' : '',
          ]"
        >
          {{ capsLock ? key : key.toLowerCase() }}
        </button>
        <!-- Hitbox -->
        <div
          @touchstart.prevent="handleKeyDown(key)"
          @mousedown="handleKeyDown(key)"
          @touchend="handleKeyUp(key)"
          @mouseup="handleKeyUp(key)"
          class="absolute inset-0 opacity-0 rounded-md cursor-pointer"
          style="margin: -4px; z-index: 10"
        ></div>
      </div>
      <div class="relative flex-[1.2]">
        <button
          @focus.prevent
          tabindex="-1"
          :class="[
            'keyboard-key w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
            pressedKeys.has('{bksp}') ? 'bg-gray-300 pressed' : '',
          ]"
        >
          ⌫
        </button>
        <!-- Hitbox -->
        <div
          @touchstart.prevent="handleKeyDown('{bksp}')"
          @mousedown="handleKeyDown('{bksp}')"
          @touchend="handleKeyUp('{bksp}')"
          @mouseup="handleKeyUp('{bksp}')"
          class="absolute inset-0 opacity-0 rounded-md cursor-pointer"
          style="margin: -4px; z-index: 10"
        ></div>
      </div>
    </div>

    <!-- Fourth row: Space and Enter -->
    <div class="flex flex-row w-full gap-1 relative">
      <div class="relative flex-[1.2]">
        <button
          @focus.prevent
          tabindex="-1"
          :class="[
            'keyboard-key w-full font-medium py-3 sm:py-4 rounded-md transition-all duration-150 border shadow-sm flex items-center justify-center',
            translateMode
              ? 'bg-purple-300 hover:bg-purple-400 text-purple-900 border-purple-400'
              : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300',
            pressedKeys.has('{translate}') ? 'bg-purple-400 pressed' : '',
          ]"
          title="Translate"
        >
          <!-- Loading spinner when translating -->
          <svg
            v-if="isTranslating"
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
          <!-- Checkmark icon when translate mode is active and text has been added -->
          <svg
            v-else-if="translateMode && hasAddedTextInTranslateMode"
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
          <!-- Translate icon otherwise -->
          <svg
            v-else
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
        </button>
        <!-- Hitbox -->
        <div
          @touchstart.prevent="handleKeyDown('{translate}')"
          @mousedown="handleKeyDown('{translate}')"
          @touchend="handleKeyUp('{translate}')"
          @mouseup="handleKeyUp('{translate}')"
          class="absolute inset-0 opacity-0 rounded-md cursor-pointer"
          style="margin: -4px; z-index: 10"
        ></div>
      </div>
      <div class="relative flex-1">
        <button
          @focus.prevent
          tabindex="-1"
          :class="[
            'keyboard-key w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
            pressedKeys.has('.') ? 'bg-gray-200 pressed' : '',
          ]"
        >
          .
        </button>
        <!-- Hitbox -->
        <div
          @touchstart.prevent="handleKeyDown('.')"
          @mousedown="handleKeyDown('.')"
          @touchend="handleKeyUp('.')"
          @mouseup="handleKeyUp('.')"
          class="absolute inset-0 opacity-0 rounded-md cursor-pointer"
          style="margin: -4px; z-index: 10"
        ></div>
      </div>
      <div class="relative flex-5">
        <button
          @focus.prevent
          tabindex="-1"
          :class="[
            'keyboard-key w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
            pressedKeys.has('{space}') ? 'bg-gray-200 pressed' : '',
          ]"
        >
          Space
        </button>
        <!-- Hitbox -->
        <div
          @touchstart.prevent="handleKeyDown('{space}')"
          @mousedown="handleKeyDown('{space}')"
          @touchend="handleKeyUp('{space}')"
          @mouseup="handleKeyUp('{space}')"
          class="absolute inset-0 opacity-0 rounded-md cursor-pointer"
          style="margin: -4px; z-index: 10"
        ></div>
      </div>
      <div class="relative flex-1">
        <button
          @focus.prevent
          tabindex="-1"
          :class="[
            'keyboard-key w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
            pressedKeys.has(',') ? 'bg-gray-200 pressed' : '',
          ]"
        >
          ,
        </button>
        <!-- Hitbox -->
        <div
          @touchstart.prevent="handleKeyDown(',')"
          @mousedown="handleKeyDown(',')"
          @touchend="handleKeyUp(',')"
          @mouseup="handleKeyUp(',')"
          class="absolute inset-0 opacity-0 rounded-md cursor-pointer"
          style="margin: -4px; z-index: 10"
        ></div>
      </div>
      <div class="relative flex-[1.2]">
        <button
          @focus.prevent
          tabindex="-1"
          :class="[
            'keyboard-key w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
            pressedKeys.has('{enter}') ? 'bg-gray-300 pressed' : '',
          ]"
        >
          Enter
        </button>
        <!-- Hitbox -->
        <div
          @touchstart.prevent="handleKeyDown('{enter}')"
          @mousedown="handleKeyDown('{enter}')"
          @touchend="handleKeyUp('{enter}')"
          @mouseup="handleKeyUp('{enter}')"
          class="absolute inset-0 opacity-0 rounded-md cursor-pointer"
          style="margin: -4px; z-index: 10"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  capsLock: {
    type: Boolean,
    default: false,
  },
  translateMode: {
    type: Boolean,
    default: false,
  },
  isTranslating: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["onKeyPress"]);

const pressedKeys = ref(new Set());
const deleteInterval = ref(null);
const deleteTimeout = ref(null);
const deleteSpeedUpTimeout = ref(null);
const hasAddedTextInTranslateMode = ref(false);

function handleKeyDown(key) {
  pressedKeys.value.add(key);

  if (key === "{bksp}") {
    // Clear any existing timers
    if (deleteTimeout.value) clearTimeout(deleteTimeout.value);
    if (deleteInterval.value) clearInterval(deleteInterval.value);

    // Emit initial delete
    emitKeyPress(key);

    // Start continuous deletion after 250ms delay
    deleteTimeout.value = setTimeout(() => {
      deleteInterval.value = setInterval(() => {
        emitKeyPress(key);
      }, 100); // Delete every 100ms while held
    }, 250);
  } else {
    emitKeyPress(key);
  }
}

function handleKeyUp(key) {
  pressedKeys.value.delete(key);

  if (key === "{bksp}") {
    // Stop both timeout and interval
    if (deleteTimeout.value) {
      clearTimeout(deleteTimeout.value);
      deleteTimeout.value = null;
    }
    if (deleteInterval.value) {
      clearInterval(deleteInterval.value);
      deleteInterval.value = null;
    }
  }
}

function emitKeyPress(key) {
  // Track if text has been added in translate mode
  if (
    props.translateMode &&
    !["{space}", "{enter}", "{bksp}", "{translate}"].includes(key)
  ) {
    hasAddedTextInTranslateMode.value = true;
  }

  // Trigger vibration on mobile devices
  if (navigator.vibrate) {
    navigator.vibrate(10); // 50ms vibration
  }

  emit("onKeyPress", key.toLowerCase());
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

.keyboard-key.pressed {
  transform: scale(0.98);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.keyboard-key:active {
  transform: scale(0.98);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
