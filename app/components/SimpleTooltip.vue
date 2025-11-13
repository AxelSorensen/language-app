<template>
  <span class="relative group">
    <span
      v-if="text && enabled"
      :class="[
        'absolute left-1/2 -translate-x-1/2 -top-10 px-3 py-2 text-sm rounded-xl z-100 whitespace-nowrap border border-gray-300 duration-200 tooltip-bubble bg-white opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity',
        type === 'translation'
          ? ' text-gray-600'
          : type === 'correction' && text === 'null'
          ? ' text-red-600'
          : ` text-green-600 cursor-pointer ${
              !isHoveringInfo ? 'hover:bg-green-50' : ''
            }`,
      ]"
      :style="{
        cursor:
          type === 'correction' && text !== 'null' ? 'pointer' : 'default',
      }"
      @click="
        type === 'correction' && text !== 'null'
          ? $emit('applyCorrection')
          : null
      "
    >
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center gap-1"
          :class="
            type === 'correction' && text === 'null' ? 'text-red-600' : ''
          "
        >
          <span
            class="inline-flex items-center justify-center w-5 h-5 rounded-full"
            :class="
              type === 'translation'
                ? 'bg-gray-200'
                : type === 'correction' && text === 'null'
                ? 'bg-red-100'
                : 'bg-green-100'
            "
          >
            <Icon
              :name="
                type === 'translation'
                  ? 'heroicons:language'
                  : type === 'correction' && text === 'null'
                  ? 'heroicons:x-mark'
                  : 'heroicons:check'
              "
              class="w-3 h-3"
              :class="
                type === 'translation'
                  ? 'text-gray-600'
                  : type === 'correction' && text === 'null'
                  ? 'text-red-600'
                  : 'text-green-600'
              "
            />
          </span>
          {{ type === "correction" && text === "null" ? "unknown" : text }}
        </span>
        <span
          v-if="explanation || (type === 'correction' && text === 'null')"
          class="relative group/info"
          :class="
            type === 'correction' && text === 'null' ? 'cursor-pointer' : ''
          "
          @mouseenter="
            type === 'correction' && text === 'null'
              ? null
              : (isHoveringInfo = true)
          "
          @mouseleave="
            type === 'correction' && text === 'null'
              ? null
              : (isHoveringInfo = false)
          "
          @click="
            type === 'correction' && text === 'null'
              ? $emit('deleteWord')
              : null
          "
        >
          <svg
            class="w-3 h-3 text-gray-400 hover:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              v-if="type === 'correction' && text === 'null'"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span
            v-if="explanation && !(type === 'correction' && text === 'null')"
            class="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded-md z-20 whitespace-nowrap bg-gray-800 text-white opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity"
          >
            {{ explanation }}
          </span>
        </span>
      </div>
    </span>

    <slot />
  </span>
</template>
<script setup>
import { ref } from "vue";

const props = defineProps({
  text: { type: String, default: "" },
  type: { type: String, default: "correction" }, // 'translation' or 'correction'
  enabled: { type: Boolean, default: true },
  explanation: { type: String, default: "" },
});

const isHoveringInfo = ref(false);
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
