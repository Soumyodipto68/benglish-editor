import { CONSONANTS, INDEPENDENT_VOWELS, VOWEL_SIGNS } from "./rules";

import type { ResolvedConsonantSyllable } from "./consonant-context";

const VIRAMA = "্";

function renderIndependentVowel(vowel: string): string {
  return INDEPENDENT_VOWELS[vowel] ?? vowel;
}

function renderConsonant(consonant: string): string {
  return consonant;
}

function renderVowelSign(vowel: string): string {
  return VOWEL_SIGNS[vowel] ?? "";
}

export function renderSyllables(
  syllables: ResolvedConsonantSyllable[],
): string {
  let result = "";

  for (const syllable of syllables) {
    /*
     * Standalone vowel.
     */
    if (syllable.consonant === null) {
      if (syllable.resolvedVowel) {
        result += renderIndependentVowel(syllable.resolvedVowel);
      }

      continue;
    }

    /*
     * Main consonant.
     */
    const consonant =
      syllable.resolvedConsonant ??
      CONSONANTS[syllable.consonant] ??
      syllable.consonant;

    result += renderConsonant(consonant);

    /*
     * Virama.
     */
    if (syllable.needsVirama) {
      result += VIRAMA;
      continue;
    }

    /*
     * Vowel sign.
     */
    if (syllable.resolvedVowel) {
      result += renderVowelSign(syllable.resolvedVowel);
    }

    /*
     * Final consonant.
     */
    if (syllable.finalConsonant && syllable.resolvedFinalConsonant) {
      result += syllable.resolvedFinalConsonant;
    }
  }

  return result;
}
