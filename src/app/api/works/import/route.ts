import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folderValue = formData.get("folderId");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a TXT file" },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".txt")) {
      return NextResponse.json(
        { error: "Only .txt files are supported right now" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be 2 MB or less" },
        { status: 400 },
      );
    }

    const title = file.name.replace(/\.txt$/i, "").trim();

    if (!title) {
      return NextResponse.json(
        { error: "The filename cannot be empty" },
        { status: 400 },
      );
    }

    let content: string;

    try {
      const bytes = await file.arrayBuffer();
      content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

      // Remove a UTF-8 BOM if the file contains one.
      content = content.replace(/^\uFEFF/, "");
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not read the file as UTF-8. Please save it as UTF-8 and try again.",
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
          { error: "Folder not found" },
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
        { error: "Drafts folder not found" },
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
        message: "TXT file imported successfully",
        work,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to import TXT file:", error);

    return NextResponse.json(
      { error: "Failed to import TXT file" },
      { status: 500 },
    );
  }
}
