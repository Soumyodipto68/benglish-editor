/**
 * Normalize Roman Bengali input.
 *
 * This function intentionally does NOT translate words.
 * It only normalizes the way the user typed them.
 */
export function normalizePhoneticWord(word: string): string {
  let result = word.toLowerCase();

  // Remove accidental repeated spaces inside a token.
  result = result.replace(/\s+/g, " ");

  /*
   * Common phonetic normalization:
   *
   * ph → f
   *
   * We will add more general rules here later.
   */
  result = result.replace(/ph/g, "f");

  return result;
}