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

  const prompt = `You are a language assistant. Provide one interesting or surprising fact about the given word in ${targetLanguage}, or null if there's nothing particularly interesting to note.

Context: The word "${word}" appears in this sentence: "${sentence}"

For the word "${word}" in ${targetLanguage}, provide exactly ONE fun, interesting, or surprising fact about its usage, context, or special meaning that would be valuable for language learners. If the word is very straightforward with no special contexts, idioms, or surprising usages, return null instead.

Return a JSON object with:
- fact: either a string with the interesting fact, or null if none`;

  const input = `Word: "${word}"`;
  const schema = {
    type: "object",
    properties: {
      fact: {
        type: ["string", "null"],
        description: "One interesting fact about the word, or null if none",
      },
    },
    required: ["fact"],
    additionalProperties: false,
  };

  const result = await llm_service.generate(
    { system: prompt, user: input },
    { schema }
  );

  console.log("Word info result:", result);

  return { result };
});
