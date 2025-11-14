import { NATIVE_LANGUAGE, LANGUAGE_INSTRUCTIONS } from "../constants";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const llm_service = event.context.llm_service;
  const sentence = body?.sentence || "";
  const settings = getCookie(event, "settings");
  const parsedSettings = settings ? JSON.parse(settings) : null;
  const targetLanguageId = parsedSettings?.targetLanguage?.id || "es";
  const targetLanguage = parsedSettings?.targetLanguage?.name || "Spanish";

  const extraInstruction = LANGUAGE_INSTRUCTIONS[targetLanguageId] || "";

  const prompt = `You are a language assistant helping ${targetLanguage} learners.

Check this ${targetLanguage} sentence for GRAMMAR errors only. IGNORE spelling mistakes, typos, or incorrect words that are just misspelled. Only flag grammatical issues like:

- Incorrect verb conjugations or tenses
- Wrong word order
- Missing or incorrect articles/prepositions
- Subject-verb agreement errors
- Incorrect gender/number agreement
- Wrong case usage (if applicable)

Do NOT flag:
- Misspelled words (e.g., "hola" written as "ola")
- Wrong words that are correctly spelled but incorrect for the context
- Punctuation issues

Return the wrong words and their correction. Return the exact text from the sentence that has grammatical errors and what it should be. Also provide a very brief explanation of the grammar rule violated.

Examples of GRAMMAR errors to flag:
- "ella puedo hablar" → wrong_text: "puedo", correction: "puede", explanation: "Subject-verb agreement error"
- "ella puedo hablo" → wrong_text: "puedo hablo", correction: "puede hablar", explanation: "Incorrect verb forms"
- "yo voy a la casa" → wrong_text: "voy a la", correction: "voy al", explanation: "Article agreement with gender"

Examples of what NOT to flag (spelling/typos):
- "hola" written as "ola" → ignore
- "casa" written as "caza" → ignore
- Using "perro" instead of "gato" → ignore

If there are no grammar errors, return empty strings for all fields.

${extraInstruction ? `- ${extraInstruction}` : ""}`;

  const input = sentence;
  const schema = {
    type: "object",
    properties: {
      wrong_text: {
        type: "string",
        description:
          "The exact wrong words from the sentence that need correction, or empty string if no errors",
      },
      correction: {
        type: "string",
        description:
          "What the wrong text should be corrected to, or empty string if no errors",
      },
      explanation: {
        type: "string",
        description:
          "A very brief explanation of why this correction is needed, or empty string if no errors",
      },
    },
    required: ["wrong_text", "correction", "explanation"],
    additionalProperties: false,
  };

  const result = await llm_service.generate(
    { system: prompt, user: input },
    { schema }
  );

  console.log("Sentence check result:", result);
  return result;
});
