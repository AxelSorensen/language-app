import { NATIVE_LANGUAGE, WORD_LANGUAGE_INSTRUCTIONS } from "../constants";

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
  const prompt = `You are a language assistant. The full sentence context is: "${context}". Analyze the specified word in this context.

You are translating from ${targetLanguage} to ${NATIVE_LANGUAGE}.

For the word you analyze, return:
- word: the original word
- correction: the corrected version (ONLY if the word is genuinely incorrect - spelling errors, grammar mistakes, or incorrect usage). If the word is correct, set this to null.
- explanation: a very brief explanation of why this correction is needed (ONLY if correction is provided, otherwise null)
- translation: the ${NATIVE_LANGUAGE} translation of the word, considering the full sentence context

IMPORTANT RULES:
- Analyze only the specified word
- Consider the entire sentence context when providing the translation to ensure accuracy
- Provide translation from ${targetLanguage} to ${NATIVE_LANGUAGE}
- Only provide correction if the word actually needs it (spelling, grammar, or usage errors)
- If no correction is needed, set correction and explanation to null
- Handle mixed-language input properly
${extraInstruction ? `- ${extraInstruction}` : ""}

Return a JSON object with the word information.`;
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
        description: "Corrected word (only if incorrect, otherwise null)",
      },
      explanation: {
        type: ["string", "null"],
        description:
          "Brief explanation of why the correction is needed (only if correction provided, otherwise null)",
      },
      translation: {
        type: "string",
        description: `${NATIVE_LANGUAGE} translation of the word`,
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
        result.correction.trim().toLowerCase()
        ? result.correction
        : null;
    // Clear explanation if no correction
    result.explanation = result.correction ? result.explanation : null;
  }
  console.log("Filtered result:", result);
  return result;
});
