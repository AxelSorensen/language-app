import { defineEventHandler, getCookie, readBody } from "h3";
import Typo from "typo-js";
import { join } from "path";
import { readFileSync, existsSync } from "fs";
import { getWordLanguageInstructions } from "../constants";

// Cache for Typo instances
const typoInstances: Record<string, Typo | null> = {};

function getTypoInstance(langCode: string): Typo | null {
  if (typoInstances[langCode] !== undefined) {
    return typoInstances[langCode];
  }

  try {
    // Map language codes to dictionary names
    const dictMap: Record<string, string> = {
      es: "es",
      en: "en_US",
      da: "da_DK",
      de: "de",
      fr: "fr",
      it: "it",
      pt: "pt",
      ko: "ko",
      ru: "ru",
      // Note: zh, ja, ar dictionaries not available from wooorm/dictionaries
      // These will fall back to LLM-only spell checking
    };

    const dictName = dictMap[langCode];
    if (!dictName) {
      console.log(`No dictionary mapping found for language: ${langCode}`);
      typoInstances[langCode] = null;
      return null;
    }

    // For built-in en_US, use the default constructor
    if (langCode === "en") {
      console.log(`Loading built-in dictionary for ${langCode}`);
      const dictionary = new Typo("en_US");
      typoInstances[langCode] = dictionary;
      return dictionary;
    }

    // For custom dictionaries, read the files
    const affPath = join(
      process.cwd(),
      "server",
      "dictionaries",
      dictName,
      `${dictName}.aff`
    );
    const dicPath = join(
      process.cwd(),
      "server",
      "dictionaries",
      dictName,
      `${dictName}.dic`
    );

    console.log(`Loading custom dictionary for ${langCode} from:`, {
      affPath,
      dicPath,
    });

    if (!existsSync(affPath) || !existsSync(dicPath)) {
      console.error(`Dictionary files not found for ${langCode}`);
      typoInstances[langCode] = null;
      return null;
    }

    const affData = readFileSync(affPath, "utf8");
    const dicData = readFileSync(dicPath, "utf8");

    console.log(
      `Read dictionary data for ${langCode}: AFF=${affData.length} chars, DIC=${dicData.length} chars`
    );

    const dictionary = new Typo(dictName, affData, dicData);
    console.log(`Successfully loaded dictionary for ${langCode}`);
    typoInstances[langCode] = dictionary;
    return dictionary;
  } catch (error) {
    console.error(`Failed to load dictionary for ${langCode}:`, error);
    typoInstances[langCode] = null;
    return null;
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const word = body?.input || "";
  const context = body?.context || "";
  const settings = getCookie(event, "settings");
  const parsedSettings = settings ? JSON.parse(settings) : null;
  const targetLanguageId = parsedSettings?.targetLanguage?.id || "es";

  // First, get suggestions from Typo.js
  const typoInstance = getTypoInstance(targetLanguageId);
  let typoSuggestions: string[] = [];
  let isTypoCorrect = false;

  const hasGoodDictionary = ["en", "es", "de", "fr", "it", "da"].includes(
    targetLanguageId
  );

  if (typoInstance && hasGoodDictionary) {
    isTypoCorrect = typoInstance.check(word);
    if (!isTypoCorrect) {
      typoSuggestions = typoInstance.suggest(word) || [];
      // Filter out suggestions that are the same as the original word
      typoSuggestions = typoSuggestions.filter(
        (suggestion) =>
          suggestion.trim().toLowerCase() !== word.trim().toLowerCase()
      );
    }
  }

  console.log(
    `Typo.js suggestions for "${word}" in ${targetLanguageId}:`,
    typoSuggestions
  );
  console.log(`Typo.js considers "${word}" correct:`, isTypoCorrect);

  // Always use LLM for spell checking to catch accent marks and context-based corrections
  const llm_service = event.context.llm_service;
  const targetLanguage = parsedSettings?.targetLanguage?.name || "Spanish";
  const sourceLanguage = parsedSettings?.sourceLanguage?.name || "English";

  const extraInstruction =
    getWordLanguageInstructions(sourceLanguage)[targetLanguageId] || "";

  let prompt: string;
  if (typoSuggestions.length > 0) {
    // Have Typo.js suggestions, ask LLM to pick the best one
    prompt = `You are a spelling correction assistant for ${targetLanguage}.

The user wrote: "${word}"
Context: "${context}"

Typo.js considers this word ${isTypoCorrect ? "correct" : "incorrect"}.
Typo.js suggestions: ${typoSuggestions.join(", ")}

Choose the best correction from the suggestions, or suggest a better one if none are good.
Even if Typo.js says it's correct, check for missing accent marks or context-based corrections.
Prioritize suggestions with the smallest edit distance to the original word.
Consider the context and phonetic similarity.

Return:
- word: the original word
- type: "valid" | "correction" | "unknown_word"
- correction: the best spelling correction, otherwise null
- explanation: brief explanation

If the word is actually correct in context, return type "valid".`;
  } else {
    // No Typo.js suggestions
    prompt = `You are a spelling correction assistant for ${targetLanguage}.

The user wrote: "${word}"
Context: "${context}"

Typo.js considers this word ${isTypoCorrect ? "correct" : "incorrect"}.

${extraInstruction}

Check if "${word}" is a valid word. If it's invalid, suggest the correct spelling.
Even if considered correct, check for missing accent marks or better spellings in context.
Consider phonetics and context.

Return:
- word: the original word
- type: "valid" | "correction" | "unknown_word"
- correction: the correct spelling if type is "correction", otherwise null
- explanation: brief explanation if type is "correction", otherwise null`;
  }

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

  try {
    const result = await llm_service.generate(
      { system: prompt, user: word },
      { schema }
    );

    console.log(`LLM result for "${word}" in ${targetLanguageId}:`, result);

    // Filter out invalid corrections
    if (result) {
      if (result.type === "correction") {
        result.correction =
          result.correction &&
          result.word.trim().toLowerCase() !==
            result.correction.trim().toLowerCase() &&
          result.correction !== "null"
            ? result.correction
            : null;
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

    console.log(
      `Optimized spell check result for "${word}" in ${targetLanguageId}:`,
      result
    );
    return result;
  } catch (error) {
    console.error("LLM spell check failed, falling back to Typo:", error);
    // Fallback to original Typo logic
    if (typoInstance) {
      const isCorrect = typoInstance.check(word);
      if (isCorrect) {
        const result = {
          word,
          type: "valid",
          correction: null,
          explanation: null,
        };
        console.log(
          `Fallback spell check result for "${word}" in ${targetLanguageId}:`,
          result
        );
        return result;
      } else {
        const suggestions = typoSuggestions;
        if (suggestions && suggestions.length > 0) {
          const result = {
            word,
            type: "correction",
            correction: suggestions[0],
            explanation: `Suggested correction from dictionary`,
          };
          console.log(
            `Fallback spell check result for "${word}" in ${targetLanguageId}:`,
            result
          );
          return result;
        } else {
          const result = {
            word,
            type: "unknown_word",
            correction: null,
            explanation: null,
          };
          console.log(
            `Fallback spell check result for "${word}" in ${targetLanguageId}:`,
            result
          );
          return result;
        }
      }
    }

    // If no dictionary available, treat as unknown word
    const result = {
      word,
      type: "unknown_word",
      correction: null,
      explanation: null,
    };
    console.log(
      `Spell check result for "${word}" in ${targetLanguageId} (no dictionary):`,
      result
    );
    return result;
  }
});
