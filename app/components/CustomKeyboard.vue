<template>
  <div
    class="select-none border-t border-gray-200 p-2 sm:p-4 rounded-t-xl shadow-lg w-full max-w-none"
  >
    {{ keyboardState.isCapsLock }}
    <div class="flex flex-row w-full gap-1 mb-1 sm:mb-2 relative">
      <KeyboardKey
        v-for="key in ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']"
        :key="'key-' + key"
        :keyValue="keyboardState.isCapsLock ? key : key.toLowerCase()"
        :pressed="pressedKeys.has(key)"
        :buttonClass="[
          'keyboard-key flex-1 min-w-0 bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-colors duration-75 border border-gray-300 shadow-sm',
          pressedKeys.has(key) ? 'bg-gray-200 pressed' : '',
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
          'keyboard-key flex-1 min-w-0 bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
          pressedKeys.has(key) ? 'bg-gray-200 pressed' : '',
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
        keyValue="{shift}"
        :pressed="pressedKeys.has('{shift}')"
        :buttonClass="[
          'keyboard-key flex-[1.5] min-w-0 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border shadow-sm',
          keyboardState.isCapsLock
            ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900 border-gray-400'
            : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 border-gray-300',
          pressedKeys.has('{shift}') ? 'bg-gray-400 pressed' : '',
        ]"
        @press="handleShiftPress"
        @release="handleKeyUp"
      >
        ⇧
      </KeyboardKey>
      <KeyboardKey
        v-for="key in ['Z', 'X', 'C', 'V', 'B', 'N', 'M']"
        :key="'key-' + key"
        :keyValue="keyboardState.isCapsLock ? key : key.toLowerCase()"
        :pressed="pressedKeys.has(key)"
        :buttonClass="[
          'keyboard-key flex-1 min-w-0 bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
          pressedKeys.has(key) ? 'bg-gray-200 pressed' : '',
        ]"
        @press="handleKeyDown"
        @release="handleKeyUp"
      >
        {{ keyboardState.isCapsLock ? key : key.toLowerCase() }}
      </KeyboardKey>
      <KeyboardKey
        key="key-backspace"
        keyValue="{backspace}"
        :pressed="pressedKeys.has('{backspace}')"
        :buttonClass="[
          'keyboard-key flex-[1.5] min-w-0 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
          pressedKeys.has('{backspace}') ? 'bg-gray-300 pressed' : '',
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
        keyValue="{tab}"
        :pressed="pressedKeys.has('{tab}')"
        :buttonClass="[
          'keyboard-key w-full font-medium py-3 sm:py-4 rounded-md transition-all duration-150 border shadow-sm flex items-center justify-center',
          translateMode
            ? 'bg-purple-300 hover:bg-purple-400 text-purple-900 border-purple-400'
            : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300',
          pressedKeys.has('{tab}') ? 'bg-purple-400 pressed' : '',
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
        <template v-else-if="translateMode && hasAddedTextInTranslateMode">
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
          'keyboard-key w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
          pressedKeys.has(',') ? 'bg-gray-200 pressed' : '',
        ]"
        style="flex: 1 1 0%"
        @press="handleKeyDown"
        @release="handleKeyUp"
      >
        ,
      </KeyboardKey>
      <KeyboardKey
        key="key-space"
        keyValue="{space}"
        :pressed="pressedKeys.has('{space}')"
        :buttonClass="[
          'keyboard-key w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
          pressedKeys.has('{space}') ? 'bg-gray-200 pressed' : '',
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
          'keyboard-key w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
          pressedKeys.has('.') ? 'bg-gray-200 pressed' : '',
        ]"
        style="flex: 1 1 0%"
        @press="handleKeyDown"
        @release="handleKeyUp"
      >
        .
      </KeyboardKey>
      <KeyboardKey
        key="key-enter"
        keyValue="{enter}"
        :pressed="pressedKeys.has('{enter}')"
        :buttonClass="[
          'keyboard-key w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm',
          pressedKeys.has('{enter}') ? 'bg-gray-300 pressed' : '',
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
});

const pressedKeys = ref(new Set());
const deleteInterval = ref(null);
const deleteTimeout = ref(null);
const deleteSpeedUpTimeout = ref(null);
const hasAddedTextInTranslateMode = ref(false);

// Keyboard state
const translateMode = ref(false);
const { state: keyboardState, actions: keyboardActions } = useKeyboard();

function handleKeyDown(key) {
  keyboardActions.pressKey(key);
}

function handleShiftPress() {
  keyboardActions.toggleCapsLock();
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
