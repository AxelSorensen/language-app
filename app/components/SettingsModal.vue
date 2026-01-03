<template>
  <Modal :is-open="isOpen" :title="$t('settingsTitle')" @close="$emit('close')">
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
  </Modal>
</template>

<script setup lang="ts">
import { useSettings } from "~/composables/useSettings";
import Modal from "~/components/Modal.vue";

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
