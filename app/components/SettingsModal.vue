<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click="$emit('close')"
  >
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" @click.stop>
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">{{ $t("settingsTitle") }}</h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Daily Word Goal</label
          >
          <input
            :value="wordGoal"
            @input="wordGoal = parseInt($event.target.value) || 1"
            type="number"
            min="1"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{
            $t("sourceLanguageLabel")
          }}</label>
          <select
            :value="sourceLanguage.id"
            @input="
              sourceLanguage =
                languages.find((lang) => lang.id === $event.target.value) ||
                languages[0]
            "
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="lang in languages" :key="lang.id" :value="lang.id">
              {{ getFlag(lang.id) }} {{ lang.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{
            $t("targetLanguageLabel")
          }}</label>
          <select
            :value="targetLanguage.id"
            @input="
              targetLanguage =
                languages.find((lang) => lang.id === $event.target.value) ||
                languages[1]
            "
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="lang in languages" :key="lang.id" :value="lang.id">
              {{ getFlag(lang.id) }} {{ lang.name }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettings } from "~/composables/useSettings";

interface Language {
  id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const { wordGoal, sourceLanguage, targetLanguage } = useSettings();

const languages: Language[] = [
  { id: "en", name: "English" },
  { id: "es", name: "Spanish" },
  { id: "da", name: "Danish" },
  { id: "fr", name: "French" },
  { id: "de", name: "German" },
  { id: "it", name: "Italian" },
  { id: "pt", name: "Portuguese" },
  { id: "zh", name: "Chinese" },
  { id: "ja", name: "Japanese" },
  { id: "ko", name: "Korean" },
  { id: "ru", name: "Russian" },
  { id: "ar", name: "Arabic" },
];

function getFlag(id: string) {
  const flags: Record<string, string> = {
    en: "🇺🇸",
    da: "🇩🇰",
    es: "🇪🇸",
    fr: "🇫🇷",
    de: "🇩🇪",
    it: "🇮🇹",
    pt: "🇵🇹",
    zh: "🇨🇳",
    ja: "🇯🇵",
    ko: "🇰🇷",
    ru: "🇷🇺",
    ar: "🇸🇦",
  };
  return flags[id] || "🏳️";
}
</script>
