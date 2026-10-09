import { runTransliterationTests } from "@/lib/transliteration/run-tests";

export async function GET() {
  const testResults = runTransliterationTests();

  return Response.json(testResults);
}