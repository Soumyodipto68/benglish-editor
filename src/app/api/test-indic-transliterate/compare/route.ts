import path from "node:path";
import { IndicTransliterator } from "@cloudrumbles/indic-transliterate";
import { TRANSLITERATION_TEST_CASES } from "@/lib/transliteration/test-cases";

export const runtime = "nodejs";

const transliterator = new IndicTransliterator({
  modelPath: path.join(
    process.cwd(),
    "node_modules",
    "@cloudrumbles",
    "indic-transliterate",
    "models",
  ),
});

async function transliterateText(input: string): Promise<string> {
  const parts = input.split(/([a-zA-Z]+)/g);

  const converted: string[] = [];

  for (const part of parts) {
    if (!/^[a-zA-Z]+$/.test(part)) {
      converted.push(part);
      continue;
    }

    const candidates = await transliterator.transliterate(part, "bn", 3);

    converted.push(candidates[0] ?? part);
  }

  return converted.join("");
}

export async function GET() {
  const results = [];

  for (const testCase of TRANSLITERATION_TEST_CASES) {
    try {
      const actual = await transliterateText(testCase.input);

      results.push({
        input: testCase.input,
        expected: testCase.expected,
        actual,
        passed: actual === testCase.expected,
        category: testCase.category,
      });
    } catch (error) {
      results.push({
        input: testCase.input,
        expected: testCase.expected,
        actual: "",
        passed: false,
        category: testCase.category,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const passed = results.filter((result) => result.passed).length;

  return Response.json({
    engine: "indic-transliterate",
    language: "bn",
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
  });
}
