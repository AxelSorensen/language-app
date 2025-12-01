import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const llm_service = event.context.llm_service;
  const word = body?.word || "";
  const sentence = body?.sentence || "";
  const settings = getCookie(event, "settings");
  const targetLanguage = settings
    ? JSON.parse(settings).targetLanguage?.name || "Spanish"
    : "Spanish";

  const prompt = `You are a language assistant. Generate 3 short, simple sentences in ${targetLanguage} that use the given word naturally and correctly.

Context: The word "${word}" appears in this sentence: "${sentence}"

Requirements:
- Each sentence should be 5-12 words long
- Use the word "${word}" in EXACTLY the same form as provided (same tense, same inflection, etc.)
- Make the sentences educational and appropriate for language learners
- Vary the sentence structures (questions, statements, different tenses for other words)
- Ensure the word is used correctly in context

Return a JSON object with an array of 3 sentences.`;

  const input = `Word: "${word}"`;
  const schema = {
    type: "object",
    properties: {
      sentences: {
        type: "array",
        items: {
          type: "string",
          description: "A short sentence using the given word",
        },
        minItems: 3,
        maxItems: 3,
        description: "Array of 3 sentences using the word",
      },
    },
    required: ["sentences"],
    additionalProperties: false,
  };

  const result = await llm_service.generate(
    { system: prompt, user: input },
    { schema }
  );

  console.log("Sentences generation result:", result);

  return { result };
});
