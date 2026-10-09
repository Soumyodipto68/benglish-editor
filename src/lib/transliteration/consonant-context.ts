import { CONSONANTS } from "./rules";

import type { Syllable } from "./syllable";

export type ResolvedConsonantSyllable = Syllable & {
  resolvedConsonant: string | null;
  resolvedFinalConsonant: string | null;
};

function resolveConsonant(
  syllable: Syllable,
  index: number,
  syllables: Syllable[],
): string | null {
  if (!syllable.consonant) {
    return null;
  }

  const consonant = syllable.consonant;

  /*
   * ch → চ / ছ
   */
  if (consonant === "ch") {
    const next = syllables[index + 1];

    if (
      syllable.vowel === "i" ||
      syllable.vowel === "e" ||
      syllable.vowel === "o"
    ) {
      return "ছ";
    }

    if (
      syllable.joined &&
      next &&
      (next.vowel === "i" || next.vowel === "e" || next.vowel === "o")
    ) {
      return "ছ";
    }

    return "চ";
  }

  return CONSONANTS[consonant] ?? consonant;
}

/*
 * Resolve consonants that appear AFTER
 * the vowel inside a syllable.
 *
 * Examples:
 *
 * kemon
 *      n → ন
 *
 * amar
 *     r → র
 *
 * kothay
 *       y → য়
 *
 * bangla
 *        ng → ং
 */
function resolveFinalConsonant(consonant: string | null): string | null {
  if (!consonant) {
    return null;
  }

  /*
   * Final y after a vowel:
   *
   * kothay → কোথায়
   */
  if (consonant === "y") {
    return "য়";
  }

  /*
   * ng before another consonant is generally
   * represented by the Bengali anusvara:
   *
   * bangla → বাংলা
   * bangladesh → বাংলাদেশ
   */
  if (consonant === "ng") {
    return "ং";
  }

  return CONSONANTS[consonant] ?? consonant;
}

export function resolveConsonants(
  syllables: Syllable[],
): ResolvedConsonantSyllable[] {
  return syllables.map((syllable, index) => ({
    ...syllable,

    resolvedConsonant: resolveConsonant(syllable, index, syllables),

    resolvedFinalConsonant: resolveFinalConsonant(syllable.finalConsonant),
  }));
}
