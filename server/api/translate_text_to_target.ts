import { NATIVE_LANGUAGE } from "../constants";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const llm_service = event.context.llm_service;
  const text = body?.text || "";
  const sentence = body?.sentence || "";
  const settings = getCookie(event, "settings");
  const targetLanguage = settings
    ? JSON.parse(settings).targetLanguage?.name || "Spanish"
    : "Spanish";

  const prompt = `You are a language assistant. Translate the given ${NATIVE_LANGUAGE} text to ${targetLanguage}, and conjugate it appropriately for how it fits in the sentence.

${NATIVE_LANGUAGE} text: "${text}"
Context sentence: "${sentence}"

Please analyze the context sentence and determine the most appropriate conjugation/grammatical form for the translated word. Consider:
- Tense (past, present, future, etc.)
- Person (first, second, third)
- Number (singular, plural)
- Mood (indicative, subjunctive, imperative, etc.)
- Any grammatical agreements needed

IMPORTANT: If the target language is zh (Mandarin Chinese), translate to Pinyin (romanized Chinese) instead of Chinese characters. Use proper Pinyin with tone marks.

Return only the properly conjugated translated text that fits naturally in the context sentence.`;

  const input = `Translate: "${text}"`;
  const schema = {
    type: "object",
    properties: {
      translated: {
        type: "string",
        description: "The translated text",
      },
    },
    required: ["translated"],
    additionalProperties: false,
  };

  const result = await llm_service.generate(
    { system: prompt, user: input },
    { schema }
  );

  console.log("Translation result:", result);

  return { result };
});
