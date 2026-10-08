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
   * Independent "a"
   * --------------------------------------------------
   *
   * Roman Bengali normally uses "a" for Bengali আ
   * when it appears as an explicit initial vowel.
   *
   * ami  → আমি
   * amar → আমার
   * apni → আপনি
   */
  if (
    syllable.consonant === null &&
    vowel === "a"
  ) {
    return "aa";
  }

  /*
   * --------------------------------------------------
   * Consonant + "a"
   * --------------------------------------------------
   *
   * In Banglish, explicit "a" after a consonant
   * commonly represents the long/open আ sound.
   *
   * bhalo → ভা
   */
  if (
    syllable.consonant !== null &&
    vowel === "a"
  ) {
    return "aa";
  }

  /*
   * --------------------------------------------------
   * Roman "o" in a closed syllable
   * --------------------------------------------------
   *
   * kemon
   *
   * ke + mon
   *
   * The final consonant closes the syllable, so
   * the "o" behaves like Bengali's inherent vowel.
   *
   * mon → মন
   *
   * rather than:
   *
   * মো + ন → মোন
   */
  if (
    syllable.consonant !== null &&
    vowel === "o" &&
    syllable.finalConsonant !== null
  ) {
    return "a";
  }

  return vowel;
}

export function resolveVowels(
  syllables: Syllable[],
): ResolvedSyllable[] {
  return syllables.map((syllable, index) => ({
    ...syllable,
    resolvedVowel: resolveVowel(
      syllable,
      index,
      syllables,
    ),
  }));
}