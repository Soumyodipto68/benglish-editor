import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: collectionId } = await params;

    const body = await request.json();

    const workId = typeof body.workId === "string" ? body.workId : "";

    const direction =
      body.direction === "up" || body.direction === "down"
        ? body.direction
        : "";

    if (!workId || !direction) {
      return NextResponse.json(
        { error: "Work ID and direction are required" },
        { status: 400 },
      );
    }

    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
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

    const current = await prisma.collectionWork.findUnique({
      where: {
        collectionId_workId: {
          collectionId,
          workId,
        },
      },
      select: {
        order: true,
      },
    });

    if (!current) {
      return NextResponse.json(
        { error: "Work is not in this collection" },
        { status: 404 },
      );
    }

    const targetOrder =
      direction === "up" ? current.order - 1 : current.order + 1;

    const target = await prisma.collectionWork.findFirst({
      where: {
        collectionId,
        order: targetOrder,
      },
      select: {
        collectionId: true,
        workId: true,
        order: true,
      },
    });

    if (!target) {
      return NextResponse.json({
        message: "Already at the edge",
      });
    }

    await prisma.$transaction([
      prisma.collectionWork.update({
        where: {
          collectionId_workId: {
            collectionId,
            workId,
          },
        },
        data: {
          order: target.order,
        },
      }),

      prisma.collectionWork.update({
        where: {
          collectionId_workId: {
            collectionId,
            workId: target.workId,
          },
        },
        data: {
          order: current.order,
        },
      }),
    ]);

    return NextResponse.json({
      message: "Work reordered successfully",
    });
  } catch (error) {
    console.error("Failed to reorder work:", error);

    return NextResponse.json(
      { error: "Failed to reorder work" },
      { status: 500 },
    );
  }
}
