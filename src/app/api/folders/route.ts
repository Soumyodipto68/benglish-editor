import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";

    const parentId = typeof body.parentId === "string" ? body.parentId : null;

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 },
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: "Folder name is too long" },
        { status: 400 },
      );
    }

    // A custom folder must have a parent.
    if (!parentId) {
      return NextResponse.json(
        {
          error: "Folders can only be created inside Others",
        },
        { status: 400 },
      );
    }

    // Make sure the parent belongs to the current user.
    const parentFolder = await prisma.folder.findFirst({
      where: {
        id: parentId,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
    });

    if (!parentFolder) {
      return NextResponse.json(
        { error: "Parent folder not found" },
        { status: 404 },
      );
    }

    /*
     * Only Others and folders inside Others
     * are allowed to contain subfolders.
     */
    if (parentFolder.name !== "Others" && parentFolder.parentId === null) {
      return NextResponse.json(
        {
          error: "Subfolders are not allowed inside this system folder",
        },
        { status: 400 },
      );
    }

    // Prevent duplicate folder names inside the same parent.
    const existingFolder = await prisma.folder.findFirst({
      where: {
        userId: session.user.id,
        parentId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    });

    if (existingFolder) {
      return NextResponse.json(
        {
          error: "A folder with this name already exists here",
        },
        { status: 409 },
      );
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        parentId,
        userId: session.user.id,
        isSystem: false,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        isSystem: true,
      },
    });

    return NextResponse.json(
      {
        message: "Folder created successfully",
        folder,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create folder:", error);

    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 },
    );
  }
}
