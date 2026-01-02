export const NATIVE_LANGUAGE = "English";

export const WORD_GOAL = 100;

export const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  zh: `IMPORTANT: The input is in Pinyin (romanized Chinese). Translate from Pinyin to ${NATIVE_LANGUAGE}. If tone marks are missing, infer the most likely meaning based on common usage.`,
  ja: `IMPORTANT: The input is in Romaji (romanized Japanese). Translate from Romaji to ${NATIVE_LANGUAGE}. Pay attention to honorifics (keigo) and maintain appropriate politeness levels.`,
  ko: `IMPORTANT: The input is in Romanized Korean. Translate from Romanized Korean to ${NATIVE_LANGUAGE}. Be aware of formal/informal speech levels and honorifics.`,
  ar: `IMPORTANT: The input is in Romanized Arabic. Translate from Romanized Arabic to ${NATIVE_LANGUAGE}. Note that Arabic is written right-to-left, but provide the ${NATIVE_LANGUAGE} translation normally.`,
  ru: `IMPORTANT: The input is in Romanized Russian. Translate from Romanized Russian to ${NATIVE_LANGUAGE}. Pay attention to formal/informal address forms.`,
  de: `IMPORTANT: Translate from German. Maintain the level of formality (du/Sie) in the ${NATIVE_LANGUAGE} equivalent.`,
  fr: `IMPORTANT: Translate from French. Preserve the level of politeness and formality.`,
  es: `IMPORTANT: Translate from Spanish. Maintain regional variations if present. `,
  it: `IMPORTANT: Translate from Italian. Preserve the warmth and expressiveness of Italian communication.`,
  pt: `IMPORTANT: Translate from Portuguese. Note if it's European or Brazilian Portuguese.`,
};

export function getLanguageInstructions(
  sourceLanguage: string
): Record<string, string> {
  return {
    zh: `IMPORTANT: The input is in Pinyin (romanized Chinese). Translate from Pinyin to ${sourceLanguage}. If tone marks are missing, infer the most likely meaning based on common usage.`,
    ja: `IMPORTANT: The input is in Romaji (romanized Japanese). Translate from Romaji to ${sourceLanguage}. Pay attention to honorifics (keigo) and maintain appropriate politeness levels.`,
    ko: `IMPORTANT: The input is in Romanized Korean. Translate from Romanized Korean to ${sourceLanguage}. Be aware of formal/informal speech levels and honorifics.`,
    ar: `IMPORTANT: The input is in Romanized Arabic. Translate from Romanized Arabic to ${sourceLanguage}. Note that Arabic is written right-to-left, but provide the ${sourceLanguage} translation normally.`,
    ru: `IMPORTANT: The input is in Romanized Russian. Translate from Romanized Russian to ${sourceLanguage}. Pay attention to formal/informal address forms.`,
    de: `IMPORTANT: Translate from German. Maintain the level of formality (du/Sie) in the ${sourceLanguage} equivalent.`,
    fr: `IMPORTANT: Translate from French. Preserve the level of politeness and formality.`,
    es: `IMPORTANT: Translate from Spanish. Maintain regional variations if present. `,
    it: `IMPORTANT: Translate from Italian. Preserve the warmth and expressiveness of Italian communication.`,
    pt: `IMPORTANT: Translate from Portuguese. Note if it's European or Brazilian Portuguese.`,
  };
}

export const WORD_LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  zh: `The input is in Pinyin (romanized Chinese). If you need to make corrections, always provide the correction in Pinyin, not in Chinese characters. Translate from Pinyin to English, inferring meaning even if tone marks are missing.`,
  ja: `The input is in Romaji (romanized Japanese). If you need to make corrections, always provide the correction in Romaji, not in Japanese characters.`,
  ko: `The input is in Romanized Korean. If you need to make corrections, always provide the correction in Romanized Korean, not in Korean characters.`,
  ar: `The input is in Romanized Arabic. If you need to make corrections, always provide the correction in Romanized Arabic, not in Arabic script.`,
  ru: `The input is in Romanized Russian. If you need to make corrections, always provide the correction in Romanized Russian, not in Cyrillic.`,
  es: `If it's a verb, include the pronoun in the translation output (e.g., hablo → (I) speak, eres → (You) are).`,
};
export function getWordLanguageInstructions(
  sourceLanguage: string
): Record<string, string> {
  return {
    zh: `The input is in Pinyin (romanized Chinese). If you need to make corrections, always provide the correction in Pinyin, not in Chinese characters. Translate from Pinyin to ${sourceLanguage}, inferring meaning even if tone marks are missing.`,
    ja: `The input is in Romaji (romanized Japanese). If you need to make corrections, always provide the correction in Romaji, not in Japanese characters.`,
    ko: `The input is in Romanized Korean. If you need to make corrections, always provide the correction in Romanized Korean, not in Korean characters.`,
    ar: `The input is in Romanized Arabic. If you need to make corrections, always provide the correction in Romanized Arabic, not in Arabic script.`,
    ru: `The input is in Romanized Russian. If you need to make corrections, always provide the correction in Romanized Russian, not in Cyrillic.`,
    es: `If it's a verb, include the pronoun in the translation output (e.g., hablo → (I) speak, eres → (You) are).`,
  };
}

export const SUGGESTION_INSTRUCTIONS: Record<string, string> = {
  zh: "Generate the completion in Pinyin (romanized Chinese), not in Chinese characters.",
  ja: "Generate the completion in Romaji (romanized Japanese), not in Japanese characters.",
  ko: "Generate the completion in Romanized Korean, not in Korean characters.",
  ar: "Generate the completion in Romanized Arabic, not in Arabic script.",
  ru: "Generate the completion in Romanized Russian, not in Cyrillic.",
};

export const OUTPUT_LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  zh: "IMPORTANT: Output the translation in Pinyin (romanized Chinese), not in Chinese characters.",
  ja: "IMPORTANT: Output the translation in Romaji (romanized Japanese), not in Japanese characters.",
  ko: "IMPORTANT: Output the translation in Romanized Korean, not in Korean characters.",
  ar: "IMPORTANT: Output the translation in Romanized Arabic, not in Arabic script.",
  ru: "IMPORTANT: Output the translation in Romanized Russian, not in Cyrillic.",
};
