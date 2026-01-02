import { computed } from "vue";
import { useCookie } from "#app";
import { WORD_GOAL, NATIVE_LANGUAGE } from "~/constants";

const settings = useCookie("settings", {
  default: () => ({
    wordGoal: WORD_GOAL,
    sourceLanguage: { id: "en", name: "English" },
    targetLanguage: { id: "es", name: "Spanish" },
  }),
  maxAge: 365 * 24 * 60 * 60,
});

export const useSettings = () => {
  const wordGoal = computed({
    get: () => settings.value.wordGoal || WORD_GOAL,
    set: (value) => {
      settings.value = { ...settings.value, wordGoal: value };
    },
  });

  const sourceLanguage = computed({
    get: () => settings.value.sourceLanguage || { id: "en", name: "English" },
    set: (value) => {
      settings.value = { ...settings.value, sourceLanguage: value };
    },
  });

  const targetLanguage = computed({
    get: () => settings.value.targetLanguage || { id: "es", name: "Spanish" },
    set: (value) => {
      settings.value = { ...settings.value, targetLanguage: value };
    },
  });

  return {
    wordGoal,
    sourceLanguage,
    targetLanguage,
  };
};
