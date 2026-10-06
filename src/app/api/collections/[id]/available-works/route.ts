import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
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

    const works = await prisma.work.findMany({
      where: {
        userId: session.user.id,
        collections: {
          none: {
            collectionId,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      works,
    });
  } catch (error) {
    console.error(
      "Failed to fetch available works:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to fetch available works" },
      { status: 500 },
    );
  }
}