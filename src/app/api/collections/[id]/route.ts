import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* GET COLLECTION */

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const collection = await prisma.collection.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        works: {
          orderBy: {
            order: "asc",
          },
          select: {
            order: true,
            work: {
              select: {
                id: true,
                title: true,
                content: true,
                folderId: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      collection,
    });
  } catch (error) {
    console.error("Failed to fetch collection:", error);

    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 },
    );
  }
}

/* RENAME COLLECTION */

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "Collection name is required" },
        { status: 400 },
      );
    }

    const collection = await prisma.collection.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    const updatedCollection = await prisma.collection.update({
      where: {
        id,
      },
      data: {
        name,
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Collection renamed successfully",
      collection: updatedCollection,
    });
  } catch (error) {
    console.error("Failed to rename collection:", error);

    return NextResponse.json(
      { error: "Failed to rename collection" },
      { status: 500 },
    );
  }
}

/* DELETE COLLECTION */

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const collection = await prisma.collection.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    await prisma.collection.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Collection deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete collection:", error);

    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 },
    );
  }
}
