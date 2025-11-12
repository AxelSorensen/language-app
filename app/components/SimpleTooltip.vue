<template>
  <span class="relative group">
    <span
      v-if="text && enabled"
      :class="[
        'absolute left-1/2 -translate-x-1/2 -top-10 px-3 py-2 text-sm rounded-xl z-10 whitespace-nowrap border border-gray-300 duration-200 tooltip-bubble bg-white opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity',
        type === 'translation'
          ? ' text-gray-600'
          : ' text-green-600 cursor-pointer hover:bg-green-50',
      ]"
      :style="{ cursor: type === 'correction' ? 'pointer' : 'default' }"
      @click="type === 'correction' ? $emit('applyCorrection') : null"
    >
      <span class="inline-flex items-center gap-1">
        <span
          class="inline-flex items-center justify-center w-5 h-5 rounded-full"
          :class="type === 'translation' ? 'bg-gray-200' : 'bg-green-100'"
        >
          <Icon
            :name="
              type === 'translation' ? 'heroicons:language' : 'heroicons:check'
            "
            class="w-3 h-3"
            :class="type === 'translation' ? 'text-gray-600' : 'text-green-600'"
          />
        </span>
        {{ text }}
      </span>
    </span>
    <slot />
  </span>
</template>

<script setup>
const props = defineProps({
  text: { type: String, default: "" },
  type: { type: String, default: "correction" }, // 'translation' or 'correction'
  enabled: { type: Boolean, default: true },
});
</script>

<style scoped>
.tooltip-bubble::before {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 7px solid #d1d5db;
  z-index: 9;
}

.tooltip-bubble::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid white;
  z-index: 10;
}
</style>
