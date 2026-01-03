<template>
  <span
    ref="tooltipRef"
    v-if="text && enabled"
    :class="[
      'fixed z-100 px-3 py-2 text-sm rounded-xl border border-gray-300 duration-200 tooltip-bubble bg-white transition-opacity',
      enabled ? 'opacity-100' : 'opacity-0',
      `tooltip-${direction}`,
      type === 'translation'
        ? ' text-gray-600'
        : type === 'correction' && text === 'null'
        ? ' text-red-600'
        : type === 'unknown'
        ? ' text-red-600'
        : type === 'sentence'
        ? ' text-green-600 cursor-pointer hover:bg-green-50'
        : ` text-green-600 cursor-pointer hover:bg-green-50`,
      // Only apply pointer-events-none for non-clickable tooltips
      (type === 'correction' && text !== 'null') ||
      type === 'unknown' ||
      type === 'sentence'
        ? ''
        : 'pointer-events-none',
    ]"
    :style="{
      left: tooltipStyle.left,
      top: tooltipStyle.top,
      transform: tooltipStyle.transform,
      '--arrow-left': tooltipStyle.arrowLeft,
    }"
    @click="
      type === 'correction' && text !== 'null'
        ? $emit('applyCorrection')
        : type === 'sentence'
        ? $emit('applySentenceCorrection')
        : null
    "
  >
    <div class="flex items-center">
      <span
        class="inline-flex justify-between items-center gap-2"
        :class="
          (type === 'translation' && text === 'unknown') || type === 'unknown'
            ? 'text-red-600'
            : ''
        "
      >
        <span
          class="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
          :class="
            type === 'translation' && text !== 'unknown'
              ? 'bg-gray-200'
              : (type === 'translation' && text === 'unknown') ||
                type === 'unknown'
              ? 'bg-red-100'
              : 'bg-green-100'
          "
        >
          <div class="flex">
            <Icon
              :name="
                type === 'translation' && text !== 'unknown'
                  ? 'heroicons:language'
                  : type === 'sentence'
                  ? 'heroicons:check'
                  : (type === 'translation' && text === 'unknown') ||
                    type === 'unknown'
                  ? 'heroicons:x-mark'
                  : 'heroicons:check'
              "
              class="w-3 h-3"
              :class="
                type === 'translation' && text !== 'unknown'
                  ? 'text-gray-600'
                  : type === 'sentence'
                  ? 'text-green-600'
                  : (type === 'translation' && text === 'unknown') ||
                    type === 'unknown'
                  ? 'text-red-600'
                  : 'text-green-600'
              "
            />
          </div>
        </span>
        {{
          (text === "unknown" && type !== "unknown") || type === "unknown"
            ? "unknown"
            : text
        }}
      </span>
      <span
        v-if="
          explanation ||
          (type === 'translation' && text === 'unknown') ||
          type === 'unknown'
        "
        class="relative group/info"
        :class="
          (type === 'translation' && text === 'unknown') || type === 'unknown'
            ? 'cursor-pointer'
            : ''
        "
        @click="
          (type === 'translation' && text === 'unknown') || type === 'unknown'
            ? ($emit('deleteWord'), $event.stopPropagation())
            : null
        "
      >
        <svg
          class="w-3 h-3 ml-1 text-gray-400 hover:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            v-if="
              (type === 'correction' && text === 'null') ||
              (type === 'translation' && text === 'unknown') ||
              type === 'unknown'
            "
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
</template>
<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { onClickOutside } from "@vueuse/core";

const props = defineProps({
  text: { type: String, default: "" },
  type: { type: String, default: "correction" }, // 'translation' or 'correction'
  enabled: { type: Boolean, default: true },
  explanation: { type: String, default: "" },
});

const emit = defineEmits<{
  applyCorrection: [];
  deleteWord: [];
  applySentenceCorrection: [];
  close: [];
}>();
const tooltipRef = ref<HTMLElement>();
const tooltipStyle = ref({ left: "", top: "", transform: "", arrowLeft: "" });
const direction = ref<"top" | "bottom">("top");
// Change this variable to 'top' or 'bottom' to control tooltip position
const tooltipDirection = "top"; // 'auto', 'top', or 'bottom'
const touchActivated = ref(false);
const touchTimeout = ref<NodeJS.Timeout | null>(null);

onClickOutside(tooltipRef, () => {
  emit("close");
});

const adjustPosition = () => {
  nextTick(() => {
    if (tooltipRef.value) {
      const rect = tooltipRef.value.getBoundingClientRect();
      const parentRect =
        tooltipRef.value.parentElement?.getBoundingClientRect();
      if (!parentRect) return;

      const padding = 20;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Determine direction
      if (tooltipDirection === "auto") {
        if (parentRect.top >= 200) {
          direction.value = "top";
        } else {
          direction.value = "bottom";
        }
      } else {
        direction.value = tooltipDirection;
      }

      // Default position based on direction
      let left = parentRect.left + parentRect.width / 2;
      let top;
      if (direction.value === "top") {
        top = parentRect.top - 40;
      } else {
        top = parentRect.bottom + 7;
      }
      let transform = "translateX(-50%) translateY(0px)";

      // Clamp horizontally
      if (left - rect.width / 2 < padding) {
        left = padding + rect.width / 2;
      } else if (left + rect.width / 2 > viewportWidth - padding) {
        left = viewportWidth - padding - rect.width / 2;
      }

      // Clamp vertically
      if (direction.value === "top") {
        if (top < padding) {
          top = padding;
        }
      } else {
        if (top + rect.height > viewportHeight - padding) {
          top = viewportHeight - rect.height - padding;
        }
      }

      // Calculate arrow position to point to the word
      const tooltipLeft = left - rect.width / 2;
      const parentCenter = parentRect.left + parentRect.width / 2;
      const arrowOffset = parentCenter - tooltipLeft;
      const arrowLeftPercent = (arrowOffset / rect.width) * 100;

      tooltipStyle.value = {
        left: `${left}px`,
        top: `${top}px`,
        transform,
        arrowLeft: `${arrowLeftPercent}%`,
      };
    }
  });
};

onMounted(() => {
  adjustPosition();
});

watch(
  () => props.enabled,
  (newVal) => {
    if (newVal) {
      adjustPosition();
    }
  }
);

watch(
  () => props.text,
  (newVal) => {
    if (newVal && props.enabled) {
      adjustPosition();
    }
  }
);

defineExpose({
  adjustPosition,
});
</script>

<style scoped>
.tooltip-bubble.tooltip-top::before {
  content: "";
  position: absolute;
  top: 100%;
  left: var(--arrow-left);
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 7px solid #d1d5db;
  z-index: 9;
}

.tooltip-bubble.tooltip-top::after {
  content: "";
  position: absolute;
  top: 100%;
  left: var(--arrow-left);
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid white;
  z-index: 10;
}

.tooltip-bubble.tooltip-bottom::before {
  content: "";
  position: absolute;
  top: -7px;
  left: var(--arrow-left);
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 7px solid #d1d5db;
  z-index: 9;
}

.tooltip-bubble.tooltip-bottom::after {
  content: "";
  position: absolute;
  top: -6px;
  left: var(--arrow-left);
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid white;
  z-index: 10;
}
</style>
