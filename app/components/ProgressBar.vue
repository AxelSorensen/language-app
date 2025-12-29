<template>
  <div class="w-full overflow-hidden bg-blue-100 rounded-full" :class="height">
    <div
      class="transition-all duration-300"
      :class="[color, height]"
      :style="{ width: Math.min((current / goal) * 100, 100) + '%' }"
    ></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  current: number;
  goal: number;
  height?: string;
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  height: "h-2",
  color: "bg-blue-600",
});
</script>
