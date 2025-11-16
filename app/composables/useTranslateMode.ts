import { ref } from "vue";
import { LanguageService } from "~/services/LanguageService";

export interface TranslateModeComposable {
  state: Ref<{
    translateMode: boolean;
    wordsToTranslate: string;
    isTranslating: boolean;
  }>;
  actions: {
    translate: (text: string) => Promise<any>;
  };
}

export function useTranslateMode(): TranslateModeComposable {
  const state = useState<{
    translateMode: boolean;
    wordsToTranslate: string;
    isTranslating: boolean;
  }>("translate-mode-state", () => ({
    translateMode: false,
    wordsToTranslate: "",
    isTranslating: false,
  }));

  async function translate(text: string) {
    state.value.isTranslating = true;
    try {
      const response = await LanguageService.translate({ text });
      state.value.wordsToTranslate = "";
      return response;
    } finally {
      state.value.isTranslating = false;
    }
  }

  return {
    state,
    actions: {
      translate,
    },
  };
}
