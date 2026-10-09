import { normalizePhoneticWord } from "./phonetic";
import { parseSyllables } from "./syllable";
import { resolveConsonants } from "./consonant-context";
import { resolveVowels } from "./vowel-context";
import { renderSyllables } from "./render";

function transliteratePart(
  part: string,
): string {
  /*
   * Preserve punctuation and symbols at
   * the end of a word.
   *
   * Examples:
   *
   * ami,   → আমি,
   * tumi?  → তুমি?
   * bhalo! → ভালো!
   */

  const match = part.match(
    /^([a-zA-Z]+)([^a-zA-Z]*)$/,
  );

  if (!match) {
    return part;
  }

  const [, word, suffix] = match;

  const normalized =
    normalizePhoneticWord(word);

  /*
   * 1. Parse phonetic structure.
   */

  const syllables =
    parseSyllables(normalized);

  /*
   * 2. Resolve consonant context.
   */

  const consonantResolved =
    resolveConsonants(syllables);

  /*
   * 3. Resolve vowel context.
   */

  const resolved =
    resolveVowels(
      consonantResolved,
    );

  /*
   * 4. Render Bengali.
   */

  return (
    renderSyllables(resolved) +
    suffix
  );
}

export function transliterateBengali(
  input: string,
): string {
  return input
    .split(/(\s+)/)
    .map((part) => {
      /*
       * Preserve whitespace exactly.
       */

      if (/^\s+$/.test(part)) {
        return part;
      }

      return transliteratePart(part);
    })
    .join("");
}