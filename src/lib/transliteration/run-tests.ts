import { transliterateBengali } from "./bengali";
import {
  TRANSLITERATION_TEST_CASES,
} from "./test-cases";

export type TransliterationTestResult = {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  category: string;
};

export function runTransliterationTests(): {
  results: TransliterationTestResult[];
  total: number;
  passed: number;
  failed: number;
} {
  const results =
    TRANSLITERATION_TEST_CASES.map(
      (testCase) => {
        const actual =
          transliterateBengali(
            testCase.input,
          );

        return {
          input: testCase.input,
          expected:
            testCase.expected,
          actual,
          passed:
            actual ===
            testCase.expected,
          category:
            testCase.category,
        };
      },
    );

  const passed =
    results.filter(
      (result) =>
        result.passed,
    ).length;

  return {
    results,
    total: results.length,
    passed,
    failed:
      results.length - passed,
  };
}