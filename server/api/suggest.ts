import { defineEventHandler, readBody, getCookie } from "h3";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const llm_service = event.context.llm_service;
  const text = body?.text || "";
  const settings = getCookie(event, "settings");
  const parsedSettings = settings ? JSON.parse(settings) : null;
  const targetLanguageId =
    body?.target || parsedSettings?.targetLanguage?.id || "es";

  // Map language IDs to names
  const languageMap: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    zh: "Mandarin Chinese",
    ja: "Japanese",
    ko: "Korean",
    ru: "Russian",
    ar: "Arabic",
    hi: "Hindi",
  };

  const targetLanguage =
    languageMap[targetLanguageId] ||
    parsedSettings?.targetLanguage?.name ||
    "Spanish";

  const prompt = `You are a language assistant. Based on the current text written so far, generate a natural completion to finish the sentence in ${targetLanguage}.

Current text: "${text}"

Requirements:
- Complete the sentence naturally and grammatically
- The completion should be appropriate for language learners
- Keep the total sentence length reasonable (aim for 8-15 words total)
- Return only the completion text that should be appended to finish the sentence

Return a JSON object with a single "completion" field containing the suggested sentence ending.`;

  const input = `Current text: "${text}"`;
  const schema = {
    type: "object",
    properties: {
      completion: {
        type: "string",
        description: "The suggested text to complete the sentence",
      },
    },
    required: ["completion"],
    additionalProperties: false,
  };

  const result = await llm_service.generate(
    { system: prompt, user: input },
    { schema }
  );

  return result;
});
