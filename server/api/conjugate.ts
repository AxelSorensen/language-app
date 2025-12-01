import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const llm_service = event.context.llm_service;
  const word = body?.word || "";
  const tense = body?.tense || "";
  const sentence = body?.sentence || "";

  const prompt = `You are a language assistant. Conjugate the given word to the specified tense.

Word: "${word}"
Tense: ${tense}
Context sentence: "${sentence}"

Please provide the conjugated form of the word "${word}" in the ${tense} tense. Return only the conjugated word, maintaining the same language as the original word.

If the word cannot be conjugated to this tense, return the original word.`;

  const input = `Conjugate "${word}" to ${tense} tense`;
  const schema = {
    type: "object",
    properties: {
      conjugated: {
        type: "string",
        description: "The conjugated form of the word",
      },
    },
    required: ["conjugated"],
    additionalProperties: false,
  };

  const result = await llm_service.generate(
    { system: prompt, user: input },
    { schema }
  );
  console.log("Conjugation result:", result);

  return { result };
});
