export const INDEPENDENT_VOWELS: Record<string, string> = {
  aa: "আ",
  a: "অ",
  ii: "ঈ",
  i: "ই",
  uu: "ঊ",
  u: "উ",
  oi: "ঐ",
  e: "এ",
  ou: "ঔ",
  o: "ও",
};

export const VOWEL_SIGNS: Record<string, string> = {
  aa: "া",
  a: "",
  ii: "ী",
  i: "ি",
  uu: "ূ",
  u: "ু",
  oi: "ৈ",
  e: "ে",
  ou: "ৌ",
  o: "ো",
};

export const CONSONANTS: Record<string, string> = {
  chh: "ছ",
  kh: "খ",
  gh: "ঘ",
  jh: "ঝ",
  th: "থ",
  dh: "ধ",
  ph: "ফ",
  bh: "ভ",
  sh: "শ",

  ng: "ঙ",
  ny: "ঞ",

  ch: "চ",
  k: "ক",
  g: "গ",
  j: "জ",
  t: "ত",
  d: "দ",
  n: "ন",
  p: "প",
  b: "ব",
  m: "ম",
  y: "য",
  r: "র",
  l: "ল",
  s: "স",
  h: "হ",
};

export const SPECIAL_CONSONANTS: Record<string, string> = {
  ksh: "ক্ষ",
  tr: "ত্র",
  kr: "ক্র",
  gr: "গ্র",
  pr: "প্র",
  br: "ব্র",
  dr: "দ্র",
  fr: "ফ্র",
  bh: "ভ",
};

export const CONSONANT_KEYS = Object.keys(CONSONANTS).sort(
  (a, b) => b.length - a.length,
);

export const VOWEL_KEYS = Object.keys(INDEPENDENT_VOWELS).sort(
  (a, b) => b.length - a.length,
);

export const SPECIAL_CONSONANT_KEYS = Object.keys(
  SPECIAL_CONSONANTS,
).sort((a, b) => b.length - a.length);