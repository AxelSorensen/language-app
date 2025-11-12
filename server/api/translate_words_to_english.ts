import { NATIVE_LANGUAGE, WORD_LANGUAGE_INSTRUCTIONS } from "../constants";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const llm_service = event.context.llm_service;
  const sentence = body?.input || "";
  const settings = getCookie(event, "settings");
  const parsedSettings = settings ? JSON.parse(settings) : null;
  const targetLanguageId = parsedSettings?.targetLanguage?.id || "es";
  const targetLanguage = parsedSettings?.targetLanguage?.name || "Spanish";

  const extraInstruction = WORD_LANGUAGE_INSTRUCTIONS[targetLanguageId] || "";

  // Construct prompt for OpenAI with explicit structured output instructions
  const prompt = `You are a language assistant. Analyze the given sentence and provide information for each word.

For each word in the sentence, return:
- word: the original word
- correction: the corrected version (ONLY if the word is genuinely incorrect - spelling errors, grammar mistakes, or incorrect usage). If the word is correct, set this to null.
- translation: the ${NATIVE_LANGUAGE} translation of the word

IMPORTANT RULES:
- Provide translation for EVERY word in the sentence to ${NATIVE_LANGUAGE}, regardless of the original language
- Only provide correction if the word actually needs it (spelling, grammar, or usage errors)
- If no correction is needed, set correction to null
- Handle mixed-language sentences properly
${extraInstruction ? `- ${extraInstruction}` : ""}

Return a JSON array of objects for each word in the sentence.`;
  const input = `Sentence: "${sentence}"`;
  const schema = {
    type: "object",
    properties: {
      words: {
        type: "array",
        items: {
          type: "object",
          properties: {
            word: {
              type: "string",
              description: "The original word from the sentence",
            },
            correction: {
              type: ["string", "null"],
              description: "Corrected word (only if incorrect, otherwise null)",
            },
            translation: {
              type: "string",
              description: `${NATIVE_LANGUAGE} translation of the word`,
            },
          },
          required: ["word", "correction", "translation"],
          additionalProperties: false,
        },
        description: "Array of word information for all words in the sentence",
      },
    },
    required: ["words"],
    additionalProperties: false,
  };
  const result = await llm_service.generate(
    { system: prompt, user: input },
    { schema }
  );
  console.log("Prompt sent:", prompt);
  console.log("Generated result:", result);

  // Filter out invalid corrections where the word is the same as the correction
  if (result && result.words) {
    result.words = result.words.map(
      (word: {
        word: string;
        correction: string | null;
        translation: string;
      }) => ({
        ...word,
        correction:
          word.correction &&
          word.word.trim().toLowerCase() !==
            word.correction.trim().toLowerCase()
            ? word.correction
            : null,
      })
    );
  }

  return { result };
});
