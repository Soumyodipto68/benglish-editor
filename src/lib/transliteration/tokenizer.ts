import {
  CONSONANT_KEYS,
  CONSONANTS,
  INDEPENDENT_VOWELS,
  VOWEL_KEYS,
} from "./rules";

export type Token =
  | {
      type: "consonant";
      value: string;
      bengali: string;
    }
  | {
      type: "vowel";
      value: string;
      bengali: string;
    }
  | {
      type: "unknown";
      value: string;
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

export function tokenize(word: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < word.length) {
    const consonant = matchToken(word, index, CONSONANT_KEYS);

    if (consonant) {
      tokens.push({
        type: "consonant",
        value: consonant,
        bengali: CONSONANTS[consonant],
      });

      index += consonant.length;
      continue;
    }

    const vowel = matchToken(word, index, VOWEL_KEYS);

    if (vowel) {
      tokens.push({
        type: "vowel",
        value: vowel,
        bengali: INDEPENDENT_VOWELS[vowel],
      });

      index += vowel.length;
      continue;
    }

    tokens.push({
      type: "unknown",
      value: word[index],
    });

    index++;
  }

  return tokens;
}