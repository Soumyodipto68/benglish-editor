import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
    workId: string;
  }>;
};

export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: collectionId, workId } = await params;

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

    const collectionWork =
      await prisma.collectionWork.findUnique({
        where: {
          collectionId_workId: {
            collectionId,
            workId,
          },
        },
      });

    if (!collectionWork) {
      return NextResponse.json(
        { error: "Work is not in this collection" },
        { status: 404 },
      );
    }

    await prisma.collectionWork.delete({
      where: {
        collectionId_workId: {
          collectionId,
          workId,
        },
      },
    });

    return NextResponse.json({
      message: "Work removed from collection",
    });
  } catch (error) {
    console.error(
      "Failed to remove work from collection:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to remove work from collection" },
      { status: 500 },
    );
  }
}