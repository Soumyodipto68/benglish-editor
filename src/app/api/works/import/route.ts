import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folderValue = formData.get("folderId");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a TXT or DOCX file." },
        { status: 400 },
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension !== "txt" && extension !== "docx") {
      return NextResponse.json(
        { error: "Only .txt and .docx files are supported." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be 2 MB or less." },
        { status: 400 },
      );
    }

    const title = file.name.replace(/\.(txt|docx)$/i, "").trim();

    if (!title) {
      return NextResponse.json(
        { error: "The filename cannot be empty." },
        { status: 400 },
      );
    }

    let content: string;

    try {
      const bytes = await file.arrayBuffer();

      if (extension === "txt") {
        content = new TextDecoder("utf-8", {
          fatal: true,
        }).decode(bytes);

        // Remove UTF-8 BOM if present.
        content = content.replace(/^\uFEFF/, "");
      } else {
        const result = await mammoth.extractRawText({
          buffer: Buffer.from(bytes),
        });

        content = result.value;
      }
    } catch (error) {
      console.error("File text extraction failed:", error);

      return NextResponse.json(
        {
          error:
            extension === "docx"
              ? "Could not read this DOCX file. Please check that it is a valid Word document."
              : "Could not read the file as UTF-8. Please save it as UTF-8 and try again.",
        },
        { status: 400 },
      );
    }

    const folderId =
      typeof folderValue === "string" && folderValue.trim()
        ? folderValue
        : null;

    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId: session.user.id,
        },
        select: { id: true },
      });

      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found." },
          { status: 404 },
        );
      }
    }

    const draftsFolder = await prisma.folder.findFirst({
      where: {
        userId: session.user.id,
        name: "Drafts",
        isSystem: true,
      },
      select: { id: true },
    });

    if (!draftsFolder) {
      return NextResponse.json(
        { error: "Drafts folder not found." },
        { status: 500 },
      );
    }

    const work = await prisma.work.create({
      data: {
        title,
        content,
        userId: session.user.id,
        folderId: folderId ?? draftsFolder.id,
      },
      select: {
        id: true,
        title: true,
        folderId: true,
      },
    });

    return NextResponse.json(
      {
        message: `${extension.toUpperCase()} file imported successfully.`,
        work,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("File import failed:", error);

    return NextResponse.json(
      { error: "Failed to import the file." },
      { status: 500 },
    );
  }
}
