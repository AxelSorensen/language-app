<template>
  <div class="fixed top-4 left-4 z-50">
    <select
      v-model="targetLanguage"
      class="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
      @change="updateLanguages"
    >
      <option v-for="lang in languages" :key="lang.id" :value="lang">
        {{ getFlag(lang.id) }} {{ lang.name }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";

const languages = [
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

const targetLanguage = ref(languages[0]); // Default to Spanish
const settingsCookie = useCookie("settings", {
  default: () => ({ targetLanguage: languages[0] }),
  maxAge: 60 * 60 * 24 * 365, // 1 year
});

const emit = defineEmits(["languageChange"]);

function getFlag(id) {
  const flags = {
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

function updateLanguages() {
  emit("languageChange", {
    source: "English", // Always English as source
    target: targetLanguage.value.name,
  });
}

// Load saved target language preference from cookie
onMounted(() => {
  const saved = settingsCookie.value.targetLanguage;
  if (saved && saved.id) {
    const found = languages.find((lang) => lang.id === saved.id);
    if (found) {
      targetLanguage.value = found;
    }
  }
  updateLanguages();
});

// Save target language preference to cookie when it changes
watch(targetLanguage, () => {
  settingsCookie.value = {
    ...settingsCookie.value,
    targetLanguage: targetLanguage.value,
  };
});
</script>
