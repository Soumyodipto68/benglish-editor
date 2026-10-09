import path from "node:path";
import { IndicTransliterator } from "@cloudrumbles/indic-transliterate";
import { TRANSLITERATION_TEST_CASES } from "@/lib/transliteration/test-cases";

export const runtime = "nodejs";

const modelPath = path.join(
  process.cwd(),
  "node_modules",
  "@cloudrumbles",
  "indic-transliterate",
  "models",
);

const standard = new IndicTransliterator({
  modelPath,
});

const rescored = new IndicTransliterator({
  modelPath,
  rescore: true,
  rescoreAlpha: 0.9,
});

async function transliterateText(
  input: string,
  engine: IndicTransliterator,
): Promise<string> {
  const parts = input.split(/([a-zA-Z]+)/g);
  const output: string[] = [];

  for (const part of parts) {
    if (!/^[a-zA-Z]+$/.test(part)) {
      output.push(part);
      continue;
    }

    const candidates = await engine.transliterate(part, "bn", 3);

    output.push(candidates[0] ?? part);
  }

  return output.join("");
}

export async function GET() {
  const results = [];

  for (const testCase of TRANSLITERATION_TEST_CASES) {
    try {
      const [standardOutput, rescoredOutput] = await Promise.all([
        transliterateText(testCase.input, standard),
        transliterateText(testCase.input, rescored),
      ]);

      results.push({
        input: testCase.input,
        expected: testCase.expected,
        standard: standardOutput,
        rescored: rescoredOutput,
        standardPassed: standardOutput === testCase.expected,
        rescoredPassed: rescoredOutput === testCase.expected,
      });
    } catch (error) {
      results.push({
        input: testCase.input,
        expected: testCase.expected,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const standardPassed = results.filter(
    (result) => result.standardPassed,
  ).length;

  const rescoredPassed = results.filter(
    (result) => result.rescoredPassed,
  ).length;

  return Response.json({
    total: results.length,
    standardPassed,
    rescoredPassed,
    results,
  });
}
