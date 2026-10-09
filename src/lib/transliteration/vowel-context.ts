import type { Syllable } from "./syllable";

export type ResolvedSyllable = Syllable & {
  resolvedVowel: string | null;
};

function resolveVowel(
  syllable: Syllable,
  index: number,
  syllables: Syllable[],
): string | null {
  const vowel = syllable.vowel;

  if (!vowel) {
    return null;
  }

  /*
   * --------------------------------------------------
   * INDEPENDENT A
   * --------------------------------------------------
   *
   * a    → অ
   * aa   → আ
   *
   * Existing baseline behavior.
   */
  if (syllable.consonant === null && vowel === "a") {
    return "a";
  }

  /*
   * --------------------------------------------------
   * INITIAL / INDEPENDENT O
   * --------------------------------------------------
   *
   * A standalone "o" at the beginning of a
   * multi-syllable word often represents অ.
   *
   * onek → অনেক
   *
   * But a standalone word:
   *
   * o → ও
   */
  if (syllable.consonant === null && vowel === "o") {
    if (syllables.length > 1) {
      return "a";
    }

    return "o";
  }

  /*
   * --------------------------------------------------
   * CLOSED O
   * --------------------------------------------------
   *
   * kemon → কেমন
   *
   * But a single-syllable word:
   *
   * bon → বোন
   *
   * therefore we only reduce o → a when the
   * syllable is not the entire word.
   */
  if (
    syllable.consonant !== null &&
    vowel === "o" &&
    syllable.finalConsonant !== null
  ) {
    if (syllables.length === 1) {
      return "o";
    }

    return "a";
  }

  /*
   * --------------------------------------------------
   * CONSONANT + A
   * --------------------------------------------------
   */
  if (syllable.consonant !== null && vowel === "a") {
    return "aa";
  }

  return vowel;
}

export function resolveVowels(syllables: Syllable[]): ResolvedSyllable[] {
  return syllables.map((syllable, index) => ({
    ...syllable,

    resolvedVowel: resolveVowel(syllable, index, syllables),
  }));
}
