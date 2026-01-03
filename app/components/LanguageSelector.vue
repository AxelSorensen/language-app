<template>
  <div>
    <button
      @click="showModal = true"
      class="cursor-pointer px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 flex items-center gap-2"
    >
      <span>{{ getFlag(targetLanguage.id) }}</span>
      <span>{{ targetLanguage.name }}</span>
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <Modal :is-open="showModal" title="Select Language" @close="showModal = false">
      <div class="space-y-2">
        <button
          v-for="lang in languages"
          :key="lang.id"
          @click="selectLanguage(lang)"
          class="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg flex items-center gap-3 transition-colors"
          :class="{ 'bg-blue-50 border border-blue-200': targetLanguage.id === lang.id }"
        >
          <span class="text-xl">{{ getFlag(lang.id) }}</span>
          <span class="font-medium">{{ lang.name }}</span>
          <span v-if="targetLanguage.id === lang.id" class="ml-auto text-blue-500">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
          </span>
        </button>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useSettings } from "~/composables/useSettings";
import Modal from "~/components/Modal.vue";

const { targetLanguage } = useSettings();

const showModal = ref(false);

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

function selectLanguage(lang) {
  targetLanguage.value = lang;
  showModal.value = false;
  emit("languageChange", {
    source: "en", // Assuming source is English
    target: lang.id,
  });
}
</script>
