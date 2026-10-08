import { transliterateBengali } from "@/lib/transliteration/bengali";

export async function GET() {
  return Response.json({
    ami: transliterateBengali("ami"),
    tumi: transliterateBengali("tumi"),
    kemon: transliterateBengali("kemon"),
    apni: transliterateBengali("apni"),
    bhalo: transliterateBengali("bhalo"),
    amar: transliterateBengali("amar"),
    naam: transliterateBengali("naam"),

    sentence: transliterateBengali(
      "ami kemon achhi",
    ),
  });
}