import { normalizePhoneticWord } from "./phonetic";
import { parseSyllables } from "./syllable";
import { resolveVowels } from "./vowel-context";
import { renderSyllables } from "./render";

export function transliterateBengali(
  input: string,
): string {
  return input
    .split(/(\s+)/)
    .map((part) => {
      /*
       * Preserve spaces exactly as entered.
       */
      if (/^\s+$/.test(part)) {
        return part;
      }

      /*
       * English/Banglish normalization
       */
      const normalized = normalizePhoneticWord(part);

      /*
       * Roman input
       *
       * ↓
       *
       * syllable structure
       */
      const syllables = parseSyllables(normalized);

      /*
       * Apply contextual vowel interpretation.
       */
      const resolved = resolveVowels(syllables);

      /*
       * Convert the phonetic structure into
       * Bengali Unicode.
       */
      return renderSyllables(resolved);
    })
    .join("");
}