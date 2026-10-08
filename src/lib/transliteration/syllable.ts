import {
  CONSONANT_KEYS,
  VOWEL_KEYS,
} from "./rules";

export type Syllable = {
  consonant: string | null;
  vowel: string | null;
  finalConsonant: string | null;
  joined: boolean;
};

function matchToken(
  word: string,
  index: number,
  tokens: string[],
): string | null {
  for (const token of tokens) {
    if (word.startsWith(token, index)) {
      return token;
    }
  }

  return null;
}

function matchConsonant(
  word: string,
  index: number,
): string | null {
  return matchToken(word, index, CONSONANT_KEYS);
}

function matchVowel(
  word: string,
  index: number,
): string | null {
  return matchToken(word, index, VOWEL_KEYS);
}

/**
 * Parse a Banglish word into phonetic syllable units.
 *
 * The parser tries to understand:
 *
 * consonant + vowel
 * consonant + vowel + final consonant
 * consonant clusters
 * independent vowels
 *
 * Examples:
 *
 * kemon → ke + mon
 * amar  → a + mar
 * naam  → naam
 * apni  → a + p + ni
 */
export function parseSyllables(word: string): Syllable[] {
  const syllables: Syllable[] = [];

  let index = 0;

  while (index < word.length) {
    /*
     * --------------------------------------------------
     * 1. Independent vowel
     * --------------------------------------------------
     *
     * Example:
     *
     * ami
     * ↑
     * a
     */
    const independentVowel = matchVowel(word, index);

    if (independentVowel) {
      syllables.push({
        consonant: null,
        vowel: independentVowel,
        finalConsonant: null,
        joined: false,
      });

      index += independentVowel.length;
      continue;
    }

    /*
     * --------------------------------------------------
     * 2. Consonant
     * --------------------------------------------------
     */
    const consonant = matchConsonant(word, index);

    if (!consonant) {
      /*
       * Unknown character.
       *
       * For now we simply move forward.
       */
      index++;
      continue;
    }

    index += consonant.length;

    /*
     * --------------------------------------------------
     * 3. Explicit vowel after consonant
     * --------------------------------------------------
     *
     * Example:
     *
     * ke
     * ↑ ↑
     * k e
     */
    const vowel = matchVowel(word, index);

    if (vowel) {
      index += vowel.length;

      /*
       * ------------------------------------------------
       * 4. Look for a final consonant
       * ------------------------------------------------
       *
       * Example:
       *
       * mon
       *
       * m + o + n
       */
      const nextConsonant = matchConsonant(word, index);

      if (nextConsonant) {
        /*
         * Look beyond the consonant.
         *
         * If another vowel follows it, the consonant
         * belongs to the NEXT syllable.
         *
         * Example:
         *
         * kemon
         *
         * m + o
         * n
         *
         * n is final because nothing follows it.
         */
        const vowelAfterNext = matchVowel(
          word,
          index + nextConsonant.length,
        );

        if (!vowelAfterNext) {
          syllables.push({
            consonant,
            vowel,
            finalConsonant: nextConsonant,
            joined: false,
          });

          index += nextConsonant.length;

          continue;
        }

        /*
         * The consonant has another vowel after it.
         *
         * Therefore it belongs to the next syllable.
         *
         * Example:
         *
         * apni
         *
         * p + ni
         */
      }

      syllables.push({
        consonant,
        vowel,
        finalConsonant: null,
        joined: false,
      });

      continue;
    }

    /*
     * --------------------------------------------------
     * 5. No vowel after consonant
     * --------------------------------------------------
     *
     * Example:
     *
     * apni
     *
     * a + p + ni
     *
     * p has no vowel, therefore it must join with
     * the following consonant.
     */
    const nextConsonant = matchConsonant(word, index);

    if (nextConsonant) {
      const vowelAfterNext = matchVowel(
        word,
        index + nextConsonant.length,
      );

      if (vowelAfterNext) {
        syllables.push({
          consonant,
          vowel: null,
          finalConsonant: null,
          joined: true,
        });

        continue;
      }
    }

    /*
     * Standalone consonant at the end.
     *
     * Example:
     *
     * amar → r
     */
    syllables.push({
      consonant,
      vowel: null,
      finalConsonant: null,
      joined: false,
    });
  }

  return syllables;
}