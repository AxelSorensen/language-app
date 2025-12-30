export const NATIVE_LANGUAGE = "English";

export const WORD_GOAL = 100;

export const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  zh: `IMPORTANT: The input is in Pinyin (romanized Chinese). Translate from Pinyin to ${NATIVE_LANGUAGE}. If tone marks are missing, infer the most likely meaning based on common usage.`,
  ja: `IMPORTANT: Translate from Japanese. Pay attention to honorifics (keigo) and maintain appropriate politeness levels.`,
  ko: `IMPORTANT: Translate from Korean. Be aware of formal/informal speech levels and honorifics.`,
  ar: `IMPORTANT: Translate from Arabic. Note that Arabic is written right-to-left, but provide the ${NATIVE_LANGUAGE} translation normally.`,
  ru: `IMPORTANT: Translate from Russian. Pay attention to formal/informal address forms.`,
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
    ja: `IMPORTANT: Translate from Japanese. Pay attention to honorifics (keigo) and maintain appropriate politeness levels.`,
    ko: `IMPORTANT: Translate from Korean. Be aware of formal/informal speech levels and honorifics.`,
    ar: `IMPORTANT: Translate from Arabic. Note that Arabic is written right-to-left, but provide the ${sourceLanguage} translation normally.`,
    ru: `IMPORTANT: Translate from Russian. Pay attention to formal/informal address forms.`,
    de: `IMPORTANT: Translate from German. Maintain the level of formality (du/Sie) in the ${sourceLanguage} equivalent.`,
    fr: `IMPORTANT: Translate from French. Preserve the level of politeness and formality.`,
    es: `IMPORTANT: Translate from Spanish. Maintain regional variations if present. `,
    it: `IMPORTANT: Translate from Italian. Preserve the warmth and expressiveness of Italian communication.`,
    pt: `IMPORTANT: Translate from Portuguese. Note if it's European or Brazilian Portuguese.`,
  };
}

export const WORD_LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  zh: `The input is in Pinyin (romanized Chinese). If you need to make corrections, always provide the correction in Pinyin, not in Chinese characters. Translate from Pinyin to English, inferring meaning even if tone marks are missing.`,
  es: `If it's a verb, include the pronoun in the translation output (e.g., hablo → (I) speak, eres → (You) are).`,
};
export function getWordLanguageInstructions(
  sourceLanguage: string
): Record<string, string> {
  return {
    zh: `The input is in Pinyin (romanized Chinese). If you need to make corrections, always provide the correction in Pinyin, not in Chinese characters. Translate from Pinyin to ${sourceLanguage}, inferring meaning even if tone marks are missing.`,
    es: `If it's a verb, include the pronoun in the translation output (e.g., hablo → (I) speak, eres → (You) are).`,
  };
}
