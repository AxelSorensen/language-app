export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const llm_service = event.context.llm_service;
  const sentence = body?.sentence || "";

  const prompt = `You are a language assistant. Translate the given sentence to the appropriate language based on the context.

Sentence to translate: "${sentence}"

Please translate the entire sentence to match the language pattern used in the existing text. If the sentence appears to be in English, translate it to Spanish. If it appears to be in another language, translate it to English.

Return only the translated sentence, maintaining the same level of formality and structure as the original.`;

  const input = `Translate sentence: "${sentence}"`;
  const schema = {
    type: "object",
    properties: {
      translated: {
        type: "string",
        description: "The translated sentence",
      },
    },
    required: ["translated"],
    additionalProperties: false,
  };

  const result = await llm_service.generate(
    { system: prompt, user: input },
    { schema }
  );

  console.log("Sentence translation result:", result);

  return { result };
});
