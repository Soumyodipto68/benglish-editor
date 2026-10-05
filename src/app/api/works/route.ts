import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read request body
    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";

    const folderId = typeof body.folderId === "string" ? body.folderId : null;

    // Validate title
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // If a folder was provided, make sure it belongs to this user
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId: session.user.id,
        },
      });

      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 },
        );
      }
    }

    // Find the user's Drafts folder
    const draftsFolder = await prisma.folder.findFirst({
      where: {
        userId: session.user.id,
        name: "Drafts",
        isSystem: true,
      },
    });

    if (!draftsFolder) {
      return NextResponse.json(
        { error: "Drafts folder not found" },
        { status: 500 },
      );
    }

    // Use selected folder or Drafts by default
    const workFolderId = folderId ?? draftsFolder.id;

    // Create the work
    const work = await prisma.work.create({
      data: {
        title,
        content: "",
        userId: session.user.id,
        folderId: workFolderId,
      },
      select: {
        id: true,
        title: true,
        folderId: true,
      },
    });

    return NextResponse.json(
      {
        message: "Work created successfully",
        work,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create work:", error);

    return NextResponse.json(
      { error: "Failed to create work" },
      { status: 500 },
    );
  }
}
