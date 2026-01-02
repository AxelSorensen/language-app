<template>
  <button
    @focus.prevent
    tabindex="-1"
    :class="buttonClass"
    @mousedown="handlePress"
    @mouseup="handleRelease"
    @mouseleave="handleRelease"
    @touchstart.prevent="handlePress"
    @touchend="handleRelease"
    @touchcancel="handleRelease"
    :style="style"
    class="relative keyboard-key"
  >
    <slot />
    <!-- Key press popup -->
    <div
      v-if="showPopup"
      class="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-gray-50 text-gray-800 font-normal w-12 h-12 rounded-full border border-gray-300 shadow-sm z-10 pointer-events-none flex items-center justify-center text-2xl"
    >
      {{ displayValue }}
    </div>
  </button>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from "vue";

const props = defineProps({
  keyValue: { type: String, required: true },
  pressed: { type: Boolean, default: false },
  buttonClass: { type: [String, Array, Object], default: "" },
  style: { type: String, default: "" },
  capsLock: { type: Boolean, default: false },
});

const emit = defineEmits(["press", "release"]);

const showPopup = ref(false);
const popupTimeout = ref(null);
const popupDelay = 25; // ms
const isPressed = ref(false);

const displayValue = computed(() => {
  // Show popup only for printable characters (letters, numbers, punctuation) but not space
  if (props.keyValue.length === 1 && props.keyValue !== " ") {
    return props.keyValue;
  }
  // For special keys like Shift, Backspace, space, etc., don't show popup
  return "";
});

function handlePress(e) {
  e.preventDefault();
  // Clear any existing popup timeout
  if (popupTimeout.value) {
    clearTimeout(popupTimeout.value);
    popupTimeout.value = null;
  }
  showPopup.value = displayValue.value !== "";
  isPressed.value = true;
  emit("press", props.keyValue);
}

function handleRelease(e) {
  e.preventDefault();
  // Delay hiding the popup
  popupTimeout.value = setTimeout(() => {
    showPopup.value = false;
    popupTimeout.value = null;
  }, popupDelay);
  isPressed.value = false;
  emit("release", props.keyValue);
}
</script>
