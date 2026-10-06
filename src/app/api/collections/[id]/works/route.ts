import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
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

    const { id: collectionId } = await params;

    const body = await request.json();

    const workId =
      typeof body.workId === "string"
        ? body.workId
        : "";

    if (!workId) {
      return NextResponse.json(
        { error: "Work ID is required" },
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

    const work = await prisma.work.findFirst({
      where: {
        id: workId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!work) {
      return NextResponse.json(
        { error: "Work not found" },
        { status: 404 },
      );
    }

    const existing = await prisma.collectionWork.findUnique({
      where: {
        collectionId_workId: {
          collectionId,
          workId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Work already exists in this collection" },
        { status: 409 },
      );
    }

    const lastWork = await prisma.collectionWork.findFirst({
      where: {
        collectionId,
      },
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    });

    const order = lastWork ? lastWork.order + 1 : 0;

    const collectionWork =
      await prisma.collectionWork.create({
        data: {
          collectionId,
          workId,
          order,
        },
        select: {
          order: true,
          work: {
            select: {
              id: true,
              title: true,
              content: true,
              updatedAt: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        message: "Work added to collection",
        collectionWork,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Failed to add work to collection:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to add work to collection" },
      { status: 500 },
    );
  }
}