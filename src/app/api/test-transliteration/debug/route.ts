import { normalizePhoneticWord } from "@/lib/transliteration/phonetic";
import { parseSyllables } from "@/lib/transliteration/syllable";
import { resolveConsonants } from "@/lib/transliteration/consonant-context";
import { resolveVowels } from "@/lib/transliteration/vowel-context";

export async function GET() {
  const words = ["kothay", "bon", "onek", "bangla", "bharat", "soumyodipto"];

  const result = words.map((word) => {
    const normalized = normalizePhoneticWord(word);

    const syllables = parseSyllables(normalized);

    const consonants = resolveConsonants(syllables);

    const vowels = resolveVowels(consonants);

    return {
      word,
      syllables,
      consonants,
      vowels,
    };
  });

  return Response.json(result);
}
