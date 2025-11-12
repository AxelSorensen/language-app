<template>
  <span class="inline-block">
    <div
      class="inline-block rounded-full animate-bounce mr-1"
      :class="[sizeClasses[size], colorClasses[color]]"
    ></div>
    <div
      class="inline-block rounded-full animate-bounce mr-1"
      :class="[sizeClasses[size], colorClasses[color]]"
      :style="{ animationDelay: '0.1s' }"
    ></div>
    <div
      class="inline-block rounded-full animate-bounce"
      :class="[sizeClasses[size], colorClasses[color]]"
      :style="{ animationDelay: '0.2s' }"
    ></div>
  </span>
</template>

<script setup>
const props = defineProps({
  color: {
    type: String,
    default: "gray",
    validator: (value) =>
      ["gray", "blue", "green", "purple", "red"].includes(value),
  },
  size: {
    type: String,
    default: "sm",
    validator: (value) => ["xs", "sm", "md", "lg"].includes(value),
  },
});

const sizeClasses = {
  xs: "w-0.5 h-0.5",
  sm: "w-1 h-1",
  md: "w-1.5 h-1.5",
  lg: "w-2 h-2",
};

const colorClasses = {
  gray: "bg-gray-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
};
</script>
