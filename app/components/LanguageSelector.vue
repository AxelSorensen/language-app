<template>
  <select
    :value="targetLanguage.id"
    class="cursor-pointer px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9"
    @input="updateTargetLanguage"
  >
    <option v-for="lang in languages" :key="lang.id" :value="lang.id">
      {{ getFlag(lang.id) }} {{ lang.name }}
    </option>
  </select>
</template>

<script setup>
import { useSettings } from "~/composables/useSettings";

const { targetLanguage } = useSettings();

const languages = [
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

const emit = defineEmits(["languageChange"]);

function getFlag(id) {
  const flags = {
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

function updateTargetLanguage(event) {
  const selectedId = event.target.value;
  const selectedLang = languages.find((lang) => lang.id === selectedId);
  if (selectedLang) {
    targetLanguage.value = selectedLang;
    emit("languageChange", {
      source: "en", // Assuming source is English
      target: selectedId,
    });
  }
}
</script>
