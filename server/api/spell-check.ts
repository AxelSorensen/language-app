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

${extraInstruction}

If the word written really sounds phonetically like a word in the target language, please correct it to the most likely word.

Return:
- word: the original word
- type: "valid" | "correction" | "unknown_word"
- correction: the correct spelling if type is "correction", otherwise null
- explanation: brief explanation if type is "correction", otherwise null

IMPORTANT RULES:
- If the word is valid in ${targetLanguage}, set type to "valid"
- If the word is invalid in ${targetLanguage} but has a clear spelling correction, set type to "correction" and provide the correction
- If the word is valid in other languages but not in ${targetLanguage}, set type to "unknown_word"
- Do not consider verb forms, plurals, or grammatical variations
- Only provide correction for obvious non-words or completely wrong spellings
- Preserve punctuation: include trailing commas, periods, etc., in corrections if present in the original word

Return a JSON object.`;
  const input = word;
  const schema = {
    type: "object",
    properties: {
      word: {
        type: "string",
        description: "The original word",
      },
      type: {
        type: "string",
        enum: ["valid", "correction", "unknown_word"],
        description:
          "The type of result: valid (no issues), correction (spelling fix needed), unknown_word (valid in other languages)",
      },
      correction: {
        type: ["string", "null"],
        description:
          "The corrected spelling if type is 'correction', otherwise null",
      },
      explanation: {
        type: ["string", "null"],
        description:
          "Brief explanation if type is 'correction', otherwise null",
      },
    },
    required: ["word", "type", "correction", "explanation"],
    additionalProperties: false,
  };
  const result = await llm_service.generate(
    { system: prompt, user: input },
    { schema }
  );

  // Filter out invalid corrections where the word is the same as the correction
  if (result) {
    if (result.type === "correction") {
      result.correction =
        result.correction &&
        result.word.trim().toLowerCase() !==
          result.correction.trim().toLowerCase() &&
        result.correction !== "null"
          ? result.correction
          : null;
      // Clear explanation if no correction
      result.explanation = result.correction ? result.explanation : null;
      if (!result.correction) {
        result.type = "valid";
      }
    } else if (result.type === "unknown_word") {
      result.correction = null;
      result.explanation = null;
    } else if (result.type === "valid") {
      result.correction = null;
      result.explanation = null;
    }
  }
  console.log("Filtered result:", result);
  return result;
});
