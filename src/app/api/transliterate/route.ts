import { NextResponse } from "next/server";
import path from "node:path";
import { IndicTransliterator } from "@cloudrumbles/indic-transliterate";

export const runtime = "nodejs";

const supportedLanguages = new Set([
  "as",
  "bn",
  "brx",
  "gom",
  "gu",
  "hi",
  "kn",
  "ks",
  "mai",
  "ml",
  "mni",
  "mr",
  "ne",
  "or",
  "pa",
  "sa",
  "sd",
  "si",
  "ta",
  "te",
  "ur",
]);

const transliterator = new IndicTransliterator({
  modelPath: path.join(
    process.cwd(),
    "node_modules",
    "@cloudrumbles",
    "indic-transliterate",
    "models",
  ),
});

// Cache results to avoid repeating model inference for the same word.
const resultCache = new Map<string, string[]>();

const MAX_CACHE_SIZE = 5000;
const MAX_WORD_LENGTH = 100;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null || !("word" in body)) {
      return NextResponse.json(
        { error: "A word is required." },
        { status: 400 },
      );
    }

    const input = body as {
      word: unknown;
      language?: unknown;
    };

    if (typeof input.word !== "string") {
      return NextResponse.json(
        { error: "Word must be a string." },
        { status: 400 },
      );
    }

    const word = input.word.trim();
    const language = typeof input.language === "string" ? input.language : "bn";

    if (!supportedLanguages.has(language)) {
      return NextResponse.json(
        { error: "Unsupported language." },
        { status: 400 },
      );
    }

    if (word.length > MAX_WORD_LENGTH) {
      return NextResponse.json({ error: "Word is too long." }, { status: 400 });
    }

    // Only transliterate individual Roman alphabetic words.
    // Return punctuation, whitespace, Bengali text, and other
    // non-Roman input unchanged.
    if (!word || !/^[A-Za-z]+$/.test(word)) {
      return NextResponse.json({
        word,
        language,
        converted: word,
        candidates: [word],
      });
    }

    const cacheKey = `${language}:${word.toLowerCase()}`;
    const cached = resultCache.get(cacheKey);

    if (cached) {
      return NextResponse.json({
        word,
        language,
        converted: cached[0] ?? word,
        candidates: cached,
      });
    }

    const modelCandidates = await transliterator.transliterate(
      word,
      language,
      5,
    );

    // Remove duplicate and empty candidates.
    const candidates = [
      ...new Set(
        modelCandidates.filter(
          (candidate) =>
            typeof candidate === "string" && candidate.trim().length > 0,
        ),
      ),
    ];

    // Keep the original spelling available in the suggestion list.
    if (!candidates.includes(word)) {
      candidates.push(word);
    }

    // Avoid unbounded cache growth.
    if (resultCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = resultCache.keys().next().value;

      if (oldestKey !== undefined) {
        resultCache.delete(oldestKey);
      }
    }

    resultCache.set(cacheKey, candidates);

    return NextResponse.json({
      word,
      language,
      converted: candidates[0] ?? word,
      candidates,
    });
  } catch (error) {
    console.error("Transliteration API error:", error);

    return NextResponse.json(
      { error: "Unable to transliterate this word." },
      { status: 500 },
    );
  }
}
