import { NATIVE_LANGUAGE, LANGUAGE_INSTRUCTIONS } from "../constants";

import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const llm_service = event.context.llm_service;
  const text = body?.text || "";
  const sentence = body?.sentence || "";
  const context = body?.context || "";
  const sourceLanguage = body?.sourceLanguage || NATIVE_LANGUAGE;
  const settings = getCookie(event, "settings");
  const parsedSettings = settings ? JSON.parse(settings) : null;
  const targetLanguageId =
    body?.target || parsedSettings?.targetLanguage?.id || "es";
  const targetLanguage =
    body?.targetName || parsedSettings?.targetLanguage?.name || "Spanish";

  // Use extra instructions if available
  const extraInstruction = LANGUAGE_INSTRUCTIONS?.[targetLanguageId] || "";

  let prompt = "";
  let input = "";

  if (sentence) {
    // Sentence translation (like translate_sentence_to_english)
    prompt = `You are a language assistant. Translate the given sentence from ${sourceLanguage} to ${targetLanguageId}.

Sentence to translate: ${sentence}

Please translate the entire sentence to ${targetLanguageId}, maintaining the same level of formality and structure as the original.

Return only the translated sentence.`;
    input = `Translate sentence: ${sentence}`;
  } else {
    // Text/word translation with context (like translate_text_to_target)
    prompt = `You are a language assistant. Translate the given ${sourceLanguage} text to ${targetLanguage}, and conjugate it appropriately for how it fits in the sentence.

${sourceLanguage} text: "${text}"
Context sentence: "${context}"

Please analyze the context sentence and determine the most appropriate conjugation/grammatical form for the translated word. Consider:
- Tense (past, present, future, etc.)
- Person (first, second, third)
- Number (singular, plural)
- Mood (indicative, subjunctive, imperative, etc.)
- Any grammatical agreements needed

IMPORTANT: If the target language is zh (Mandarin Chinese), translate to Pinyin (romanized Chinese) instead of Chinese characters. Use proper Pinyin with tone marks.

Return only the properly conjugated translated text that fits naturally in the context sentence.`;
    input = `Translate: "${text}"`;
  }

  console.log("Translation prompt:", prompt);

  const schema = {
    type: "object",
    properties: {
      translation: {
        type: "string",
        description: "The translated text or sentence",
      },
    },
    required: ["translation"],
    additionalProperties: false,
  };

  const result = await llm_service.generate(
    { system: prompt, user: input },
    { schema }
  );

  console.log("Translation result:", result);

  return result;
});
