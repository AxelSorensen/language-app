<template>
  <div
    class="custom-keyboard bg-white border-t border-gray-200 p-2 sm:p-4 rounded-t-xl shadow-lg w-full max-w-none"
  >
    <!-- First row: QWERTYUIOP -->
    <div class="flex flex-row w-full gap-1 mb-1 sm:mb-2">
      <button
        v-for="key in ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']"
        :key="key"
        @click.prevent="emitKeyPress(key)"
        @focus.prevent
        tabindex="-1"
        class="keyboard-key flex-1 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm min-w-0"
      >
        {{ capsLock ? key : key.toLowerCase() }}
      </button>
    </div>

    <!-- Second row: ASDFGHJKL -->
    <div class="flex flex-row w-full gap-1 mb-1 sm:mb-2 pl-4 pr-4">
      <span class="flex-[0.5]" />
      <button
        v-for="key in ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']"
        :key="key"
        @click.prevent="emitKeyPress(key)"
        @focus.prevent
        tabindex="-1"
        class="keyboard-key flex-1 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm min-w-0"
      >
        {{ capsLock ? key : key.toLowerCase() }}
      </button>
      <span class="flex-[0.5]" />
    </div>

    <!-- Third row: ZXCVBNM and special keys -->
    <div class="flex flex-row w-full gap-1 mb-1 sm:mb-2">
      <button
        @click.prevent="emitKeyPress('{shift}')"
        @focus.prevent
        tabindex="-1"
        :class="[
          'keyboard-key flex-[1.2] font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border shadow-sm min-w-0',
          capsLock
            ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900 border-gray-400'
            : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 border-gray-300',
        ]"
      >
        ⇧
      </button>
      <button
        v-for="key in ['Z', 'X', 'C', 'V', 'B', 'N', 'M']"
        :key="key"
        @click.prevent="emitKeyPress(key)"
        @focus.prevent
        tabindex="-1"
        class="keyboard-key flex-1 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm min-w-0"
      >
        {{ capsLock ? key : key.toLowerCase() }}
      </button>
      <button
        @click.prevent="emitKeyPress('{bksp}')"
        @focus.prevent
        tabindex="-1"
        class="keyboard-key flex-[1.2] bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm min-w-0"
      >
        ⌫
      </button>
    </div>

    <!-- Fourth row: Space and Enter -->
    <div class="flex flex-row w-full gap-1">
      <button
        @click.prevent="emitKeyPress('{translate}')"
        @focus.prevent
        tabindex="-1"
        class="keyboard-key flex-[1.2] bg-purple-100 hover:bg-purple-200 active:bg-purple-300 text-purple-700 font-medium py-3 sm:py-4 rounded-md transition-all duration-150 border border-purple-300 shadow-sm min-w-0 flex items-center justify-center"
        title="Translate"
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
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          ></path>
        </svg>
      </button>
      <button
        @click.prevent="emitKeyPress('{space}')"
        @focus.prevent
        tabindex="-1"
        class="keyboard-key flex-5 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-800 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm min-w-0"
      >
        Space
      </button>
      <button
        @click.prevent="emitKeyPress('{enter}')"
        @focus.prevent
        tabindex="-1"
        class="keyboard-key flex-[1.8] bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-medium py-3 sm:py-4 text-base sm:text-lg rounded-md transition-all duration-150 border border-gray-300 shadow-sm min-w-0"
      >
        Enter
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  capsLock: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["onKeyPress"]);

function emitKeyPress(key) {
  emit("onKeyPress", key.toLowerCase());
}
</script>

<style scoped>
.keyboard-key {
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  overflow: hidden;
}

.keyboard-key::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent
  );
  transition: left 0.5s;
}

.keyboard-key:active::before {
  left: 100%;
}

.keyboard-key:active {
  transform: scale(0.98);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
