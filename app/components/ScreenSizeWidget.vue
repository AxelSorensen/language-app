<template>
  <div
    class="fixed top-4 right-4 z-50 bg-black/80 text-white px-3 py-2 rounded-lg font-mono text-sm border border-gray-600 shadow-lg"
  >
    {{ currentBreakpoint }}
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const currentBreakpoint = ref("xs");

const getBreakpoint = (width) => {
  if (width >= 1536) return "2xl";
  if (width >= 1280) return "xl";
  if (width >= 1024) return "lg";
  if (width >= 768) return "md";
  if (width >= 640) return "sm";
  return "xs";
};

const updateBreakpoint = () => {
  currentBreakpoint.value = getBreakpoint(window.innerWidth);
};

onMounted(() => {
  updateBreakpoint();
  window.addEventListener("resize", updateBreakpoint);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateBreakpoint);
});
</script>
