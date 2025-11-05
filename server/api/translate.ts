export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const llm_service = event.context.llm_service;
  const text = body?.text || "";
  const sentence = body?.sentence || "";

  const prompt = `You are a language assistant. Translate the given English text to the appropriate language based on the context, and conjugate it appropriately for how it fits in the sentence.

English text: "${text}"
Context sentence: "${sentence}"

Please analyze the context sentence and determine the most appropriate conjugation/grammatical form for the translated word. Consider:
- Tense (past, present, future, etc.)
- Person (first, second, third)
- Number (singular, plural)
- Mood (indicative, subjunctive, imperative, etc.)
- Any grammatical agreements needed

IMPORTANT: If the target language is Mandarin Chinese, translate to Pinyin (romanized Chinese) instead of Chinese characters. Use proper Pinyin with tone marks.

Return only the properly conjugated translated text that fits naturally in the context sentence.`;

  console.log("Translation prompt:", prompt);

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
