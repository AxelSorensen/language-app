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

Check this ${targetLanguage} sentence for errors: "${sentence}"

Return the wrong words and their correction. Return the exact text from the sentence that is incorrect and what it should be. Also provide a very brief explanation of why this correction is needed.

Examples:
- "ella puedo hablar" → wrong_text: "puedo", correction: "puede", explanation: "Subject-verb agreement error"
- "ella puedo hablo" → wrong_text: "puedo hablo", correction: "puede hablar", explanation: "Incorrect verb forms"
- "yo soy estudiante" → wrong_text: "", correction: "", explanation: "" (no errors)

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
