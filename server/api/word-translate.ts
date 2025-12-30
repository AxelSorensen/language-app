import { getWordLanguageInstructions } from "../constants";

import { defineEventHandler, getCookie, readBody } from "h3";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const llm_service = event.context.llm_service;
  const word = body?.input || "";
  const context = body?.context || "";
  const settings = getCookie(event, "settings");
  const parsedSettings = settings ? JSON.parse(settings) : null;
  const targetLanguageId = parsedSettings?.targetLanguage?.id || "es";
  const targetLanguage = parsedSettings?.targetLanguage?.name || "Spanish";
  const sourceLanguage = parsedSettings?.sourceLanguage?.name || "English";

  const extraInstruction =
    getWordLanguageInstructions(sourceLanguage)[targetLanguageId] || "";
  console.log("Translating word:", word, "with context:", context);
  // Construct prompt for translation
  const prompt = `You are a translation assistant. Translate the specified word: "${word}" from ${targetLanguage} to ${sourceLanguage}, considering the context: "${context}".

Return:
- word: the original word
- translation: the ${sourceLanguage} translation. If the word is unknown or ambiguous, set to "unknown".

IMPORTANT RULES:
- Provide translation for known words in context.
- Set translation to "unknown" only if the word is genuinely unrecognized or has multiple meanings that can't be disambiguated.
- Prefer providing translation over marking as unknown.
- Preserve punctuation: include trailing commas, periods, etc., in the translation if present in the original word.

Return a JSON object.`;
  const input = word;
  const schema = {
    type: "object",
    properties: {
      word: {
        type: "string",
        description: "The original word",
      },
      translation: {
        type: "string",
        description: `${sourceLanguage} translation or "unknown"`,
      },
    },
    required: ["word", "translation"],
    additionalProperties: false,
  };
  const result = await llm_service.generate(
    { system: prompt, user: input },
    { schema }
  );

  // Set translation to "unknown" if null
  if (result && !result.translation) result.translation = "unknown";

  console.log("Translation result:", result);
  return result;
});
