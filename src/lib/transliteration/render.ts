import {
  CONSONANTS,
  INDEPENDENT_VOWELS,
  VOWEL_SIGNS,
} from "./rules";

import type { ResolvedSyllable } from "./vowel-context";

const VIRAMA = "্";

function renderIndependentVowel(vowel: string): string {
  return INDEPENDENT_VOWELS[vowel] ?? vowel;
}

function renderConsonant(consonant: string): string {
  return CONSONANTS[consonant] ?? consonant;
}

function renderVowelSign(vowel: string): string {
  return VOWEL_SIGNS[vowel] ?? "";
}

export function renderSyllables(
  syllables: ResolvedSyllable[],
): string {
  let result = "";

  for (const syllable of syllables) {
    /*
     * --------------------------------------------------
     * Independent vowel
     * --------------------------------------------------
     *
     * ami
     *
     * a → অ
     */
    if (syllable.consonant === null) {
      if (syllable.resolvedVowel) {
        result += renderIndependentVowel(
          syllable.resolvedVowel,
        );
      }

      continue;
    }

    /*
     * --------------------------------------------------
     * Joined consonant
     * --------------------------------------------------
     *
     * apni
     *
     * p + virama
     *
     * The next syllable will provide the next consonant.
     */
    if (syllable.joined) {
      result += renderConsonant(syllable.consonant);
      result += VIRAMA;

      continue;
    }

    /*
     * --------------------------------------------------
     * Normal consonant
     * --------------------------------------------------
     */
    result += renderConsonant(syllable.consonant);

    /*
     * --------------------------------------------------
     * Vowel
     * --------------------------------------------------
     *
     * ka → ক
     * ki → কি
     * ke → কে
     * ko → কো
     *
     * For "a", the vowel sign is empty.
     */
    if (syllable.resolvedVowel) {
      result += renderVowelSign(
        syllable.resolvedVowel,
      );
    }

    /*
     * --------------------------------------------------
     * Final consonant
     * --------------------------------------------------
     *
     * kemon
     *
     * mon
     *   ↓
     * ম + ে + ন
     */
    if (syllable.finalConsonant) {
      result += renderConsonant(
        syllable.finalConsonant,
      );
    }
  }

  return result;
}