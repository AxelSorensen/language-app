export class LanguageService {
  static async checkSentenceGrammar(
    text: string,
    language: string
  ): Promise<string> {
    try {
      const response = await $fetch("/api/check-sentence", {
        method: "POST",
        body: { sentence: text, language },
      });
      return response.result?.corrected || "";
    } catch (error) {
      console.error("Grammar correction failed:", error);
      return "";
    }
  }

  static async checkSentence(sentence: string, language: string) {
    return $fetch(`/api/check-sentence`, {
      method: "POST",
      body: { sentence, language },
    });
  }

  static async conjugate(word: string, language: string) {
    return $fetch(`/api/conjugate`, {
      method: "POST",
      body: { word, language },
    });
  }

  static async spellCheck(input: string, context: string) {
    return $fetch(`/api/spell-check`, {
      method: "POST",
      body: { input, context },
    });
  }

  static async getSentences(language: string) {
    return $fetch(`/api/sentences`, {
      method: "GET",
      query: { language },
    });
  }

  static async translate({
    text = "",
    sentence = "",
    context = "",
    sourceLanguage = "",
    targetLanguage = "",
    targetLanguageId = "",
  }: {
    text?: string;
    sentence?: string;
    context?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    targetLanguageId?: string;
  }) {
    return $fetch(`/api/translate`, {
      method: "POST",
      body: {
        text,
        sentence,
        context,
        sourceLanguage,
        targetLanguage,
        targetLanguageId,
      },
    });
  }

  static async getWordInfo(word: string, language: string) {
    return $fetch(`/api/word-info`, {
      method: "POST",
      body: { word, language },
    });
  }
}
