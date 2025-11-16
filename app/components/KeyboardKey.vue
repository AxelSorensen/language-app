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
  >
    <slot />
  </button>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  keyValue: { type: String, required: true },
  pressed: { type: Boolean, default: false },
  buttonClass: { type: [String, Array, Object], default: "" },
  style: { type: String, default: "" },
  capsLock: { type: Boolean, default: false },
});

const emit = defineEmits(["press", "release"]);

function handlePress(e) {
  e.preventDefault();
  emit("press", props.keyValue);
}
function handleRelease(e) {
  e.preventDefault();
  emit("release", props.keyValue);
}
</script>
