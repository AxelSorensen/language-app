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

  const prompt = `Check this ${targetLanguage} sentence for basic grammar errors and missing accent marks.

Focus on obvious errors like:
- Wrong verb forms (e.g., "ella puedo" → "ella puede")
- Missing/incorrect articles (e.g., "la casa" → "el casa" for masculine)
- Subject-verb agreement (e.g., "ellos es" → "ellos son")
- Missing accent marks that change meaning or are required (e.g., "que" → "qué", "como" → "cómo", "tu" → "tú")

IGNORE:
- Spelling mistakes (use spell-check for that)
- Word choice errors
- Punctuation
- Complex grammar rules

Return:
- type: "valid" | "correction"
- wrong_text: exact wrong words from sentence
- correction: what it should be

If no obvious grammar errors or missing accents, return type "valid" with empty strings.

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
