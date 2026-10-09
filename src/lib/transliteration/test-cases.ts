export type TransliterationTestCase = {
  input: string;
  expected: string;
  category: string;
};

export const TRANSLITERATION_TEST_CASES: TransliterationTestCase[] = [
  /*
   * ==========================================
   * Independent vowels
   * ==========================================
   */
  {
    input: "a",
    expected: "অ",
    category: "vowels",
  },
  {
    input: "aa",
    expected: "আ",
    category: "vowels",
  },
  {
    input: "i",
    expected: "ই",
    category: "vowels",
  },
  {
    input: "ii",
    expected: "ঈ",
    category: "vowels",
  },
  {
    input: "u",
    expected: "উ",
    category: "vowels",
  },
  {
    input: "uu",
    expected: "ঊ",
    category: "vowels",
  },
  {
    input: "e",
    expected: "এ",
    category: "vowels",
  },
  {
    input: "oi",
    expected: "ঐ",
    category: "vowels",
  },
  {
    input: "o",
    expected: "ও",
    category: "vowels",
  },
  {
    input: "ou",
    expected: "ঔ",
    category: "vowels",
  },

  /*
   * ==========================================
   * Basic words
   * ==========================================
   */
  {
    input: "ami",
    expected: "আমি",
    category: "basic words",
  },
  {
    input: "tumi",
    expected: "তুমি",
    category: "basic words",
  },
  {
    input: "kemon",
    expected: "কেমন",
    category: "basic words",
  },
  {
    input: "apni",
    expected: "আপনি",
    category: "basic words",
  },
  {
    input: "bhalo",
    expected: "ভালো",
    category: "basic words",
  },
  {
    input: "amar",
    expected: "আমার",
    category: "basic words",
  },
  {
    input: "naam",
    expected: "নাম",
    category: "basic words",
  },

  /*
   * ==========================================
   * Common words
   * ==========================================
   */
  {
    input: "achhi",
    expected: "আছি",
    category: "common words",
  },
  {
    input: "acho",
    expected: "আছো",
    category: "common words",
  },
  {
    input: "achen",
    expected: "আছেন",
    category: "common words",
  },
  {
    input: "ache",
    expected: "আছে",
    category: "common words",
  },
  {
    input: "ki",
    expected: "কি",
    category: "common words",
  },
  {
    input: "kothay",
    expected: "কোথায়",
    category: "common words",
  },
  {
    input: "keno",
    expected: "কেনো",
    category: "common words",
  },
  {
    input: "kirokom",
    expected: "কিরকম",
    category: "common words",
  },
  {
    input: "onek",
    expected: "অনেক",
    category: "common words",
  },
  {
    input: "sob",
    expected: "সব",
    category: "common words",
  },
  {
    input: "shob",
    expected: "শব",
    category: "common words",
  },

  /*
   * ==========================================
   * Family / people
   * ==========================================
   */
  {
    input: "ma",
    expected: "মা",
    category: "people",
  },
  {
    input: "maa",
    expected: "মা",
    category: "people",
  },
  {
    input: "baba",
    expected: "বাবা",
    category: "people",
  },
  {
    input: "dada",
    expected: "দাদা",
    category: "people",
  },
  {
    input: "didi",
    expected: "দিদি",
    category: "people",
  },
  {
    input: "bhai",
    expected: "ভাই",
    category: "people",
  },
  {
    input: "bon",
    expected: "বোন",
    category: "people",
  },

  /*
   * ==========================================
   * Places / names
   * ==========================================
   */
  {
    input: "kolkata",
    expected: "কলকাতা",
    category: "places",
  },
  {
    input: "bangla",
    expected: "বাংলা",
    category: "places",
  },
  {
    input: "bangladesh",
    expected: "বাংলাদেশ",
    category: "places",
  },
  {
    input: "bharat",
    expected: "ভারত",
    category: "places",
  },

  /*
   * ==========================================
   * Common sentence fragments
   * ==========================================
   */
  {
    input: "ami bhalo achhi",
    expected: "আমি ভালো আছি",
    category: "sentences",
  },
  {
    input: "tumi kemon acho",
    expected: "তুমি কেমন আছো",
    category: "sentences",
  },
  {
    input: "apni kemon achen",
    expected: "আপনি কেমন আছেন",
    category: "sentences",
  },
  {
    input: "amar naam soumyodipto",
    expected: "আমার নাম সৌম্যদীপ্ত",
    category: "sentences",
  },

  /*
   * ==========================================
   * Spaces / punctuation
   * ==========================================
   */
  {
    input: "ami,",
    expected: "আমি,",
    category: "punctuation",
  },
  {
    input: "tumi?",
    expected: "তুমি?",
    category: "punctuation",
  },
  {
    input: "bhalo!",
    expected: "ভালো!",
    category: "punctuation",
  },
  {
    input: "ami kemon achhi?",
    expected: "আমি কেমন আছি?",
    category: "punctuation",
  },
];