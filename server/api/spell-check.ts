import { NATIVE_LANGUAGE, WORD_LANGUAGE_INSTRUCTIONS } from "../constants";

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

  const extraInstruction = WORD_LANGUAGE_INSTRUCTIONS[targetLanguageId] || "";

  // Construct prompt for OpenAI with explicit structured output instructions
  const prompt = `You are a spelling correction assistant for ${targetLanguage}.

Check if "${word}" is a valid word in ${targetLanguage}. Do not consider context, conjugation, grammar, or any linguistic analysis - just check if it's a basic dictionary word.

Return:
- word: the original word
- correction: the correct spelling if it's not a valid ${targetLanguage} word, otherwise null
- explanation: brief explanation if correction provided, otherwise null

IMPORTANT RULES:
- Only correct if the word is completely invalid in ${targetLanguage}
- Do not correct valid words that might be misspelled in context
- Do not consider verb forms, plurals, or grammatical variations
- Only provide correction for obvious non-words or completely wrong spellings
- If the word exists in ${targetLanguage} dictionary (in any form), set correction to null

Return a JSON object.`;
  const input = word;
  const schema = {
    type: "object",
    properties: {
      word: {
        type: "string",
        description: "The original word",
      },
      correction: {
        type: ["string", "null"],
        description:
          "Correct spelling if the word is invalid in the target language, otherwise null",
      },
      explanation: {
        type: ["string", "null"],
        description:
          "Brief explanation of the spelling error (only if correction provided, otherwise null)",
      },
    },
    required: ["word", "correction", "explanation"],
    additionalProperties: false,
  };
  const result = await llm_service.generate(
    { system: prompt, user: input },
    { schema }
  );

  // Filter out invalid corrections where the word is the same as the correction
  if (result) {
    result.correction =
      result.correction &&
      result.word.trim().toLowerCase() !==
        result.correction.trim().toLowerCase() &&
      result.correction !== "null"
        ? result.correction
        : null;
    // Clear explanation if no correction
    result.explanation = result.correction ? result.explanation : null;
  }
  console.log("Filtered result:", result);
  return result;
});
