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
  const prompt = `You are a spelling and translation assistant. Analyze the specified word: "${word}" in the context: "${context}".

You are translating from ${targetLanguage} to ${NATIVE_LANGUAGE}.

Return:
- word: the original word
- correction: the corrected spelling (ONLY if it's a clear spelling error). If correctly spelled, set to null.
- translation: the ${NATIVE_LANGUAGE} translation. If the word is unknown or ambiguous, set to "unknown".

IMPORTANT RULES:
- Correct spelling for common errors (e.g., "teh" -> "the").
- Corrections should be in ${targetLanguage}.
- Provide translation for known words in context.
- Set translation to "unknown" only if the word is genuinely unrecognized or has multiple meanings that can't be disambiguated.
- Prefer providing translation over marking as unknown.

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
          "Corrected spelling (only if very obvious, otherwise null)",
      },
      explanation: {
        type: ["string", "null"],
        description:
          "Brief explanation of the spelling error (only if correction provided, otherwise null)",
      },
      translation: {
        type: "string",
        description: `${NATIVE_LANGUAGE} translation or "unknown"`,
      },
    },
    required: ["word", "correction", "explanation", "translation"],
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
    // Set translation to "unknown" if null
    if (!result.translation) result.translation = "unknown";
  }
  console.log("Filtered result:", result);
  return result;
});
