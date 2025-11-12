import { NATIVE_LANGUAGE, LANGUAGE_INSTRUCTIONS } from "../constants";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const llm_service = event.context.llm_service;
  const sentence = body?.sentence || "";
  const settings = getCookie(event, "settings");
  const parsedSettings = settings ? JSON.parse(settings) : null;
  const targetLanguageId = parsedSettings?.targetLanguage?.id || "es";
  const targetLanguageName = parsedSettings?.targetLanguage?.name || "Spanish";

  const extraInstruction = LANGUAGE_INSTRUCTIONS[targetLanguageId] || "";

  const prompt = `You are a language assistant. Translate the given sentence from ${targetLanguageName} to ${NATIVE_LANGUAGE}.

Sentence to translate: "${sentence}"

Please translate the entire sentence to ${NATIVE_LANGUAGE}, maintaining the same level of formality and structure as the original.
${extraInstruction}

Return only the translated sentence.`;

  const input = `Translate sentence: "${sentence}"`;
  const schema = {
    type: "object",
    properties: {
      translated: {
        type: "string",
        description: "The translated sentence",
      },
    },
    required: ["translated"],
    additionalProperties: false,
  };

  const result = await llm_service.generate(
    { system: prompt, user: input },
    { schema }
  );

  console.log("Sentence translation result:", result);

  return { result };
});
