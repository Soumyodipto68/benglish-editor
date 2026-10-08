import type { Syllable } from "./syllable";

/**
 * Bengali vowel interpretation.
 *
 * The Roman "a" is context-sensitive.
 *
 * Example:
 *
 * bhalo → bha + lo → ভা + লো
 * amar  → a + mar  → অ + মার
 *
 * This layer decides how the phonetic "a" should behave.
 */

export type ResolvedSyllable = Syllable & {
  resolvedVowel: string | null;
};

function isIndependentVowel(syllable: Syllable): boolean {
  return syllable.consonant === null;
}

function isConsonantSyllable(syllable: Syllable): boolean {
  return syllable.consonant !== null;
}

function resolveInitialA(
  syllable: Syllable,
  index: number,
): string {
  /*
   * An independent initial "a" normally represents
   * Bengali অ.
   *
   * Example:
   *
   * ami  → অ
   * amar → অ
   * apni → অ
   */
  if (isIndependentVowel(syllable) && syllable.vowel === "a") {
    return "a";
  }

  /*
   * A consonant + "a" is initially treated as
   * the short/default vowel.
   *
   * The next layer will refine this further.
   *
   * Example:
   *
   * k + a → ক
   * m + a → ম
   */
  if (
    isConsonantSyllable(syllable) &&
    syllable.vowel === "a"
  ) {
    return "a";
  }

  return syllable.vowel;
}

/**
 * Resolve phonetic vowels according to their context.
 */
export function resolveVowels(
  syllables: Syllable[],
): ResolvedSyllable[] {
  return syllables.map((syllable, index) => ({
    ...syllable,
    resolvedVowel: resolveInitialA(syllable, index),
  }));
}