import { defineEventHandler, getCookie } from "h3";
import { getLanguageInstructions } from "../constants";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const llm_service = event.context.llm_service;
  const sentence = body?.sentence || "";
  const settings = getCookie(event, "settings");
  const parsedSettings = settings ? JSON.parse(settings) : null;
  const targetLanguageId = parsedSettings?.targetLanguage?.id || "es";
  const targetLanguage = parsedSettings?.targetLanguage?.name || "Spanish";
  const sourceLanguage = parsedSettings?.sourceLanguage?.name || "English";

  const extraInstruction =
    getLanguageInstructions(sourceLanguage)[targetLanguageId] || "";

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

Return the wrong words and their correction. Return the exact text from the sentence that has grammatical errors and what it should be.

Return:
- type: "valid" | "correction"
- wrong_text: the exact wrong words if type is "correction", otherwise empty string
- correction: what it should be if type is "correction", otherwise empty string

Examples of GRAMMAR errors to flag:
- "ella puedo hablar" → wrong_text: "puedo", correction: "puede"
- "ella puedo hablo" → wrong_text: "puedo hablo", correction: "puede hablar"
- "yo voy a la casa" → wrong_text: "voy a la", correction: "voy al"

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
      type: {
        type: "string",
        enum: ["valid", "correction"],
        description:
          "Whether there are grammar errors: valid (no errors), correction (grammar fix needed)",
      },
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
    },
    required: ["type", "wrong_text", "correction"],
    additionalProperties: false,
  };

  const result = await llm_service.generate(
    { system: prompt, user: input },
    { schema }
  );

  return result;
});
