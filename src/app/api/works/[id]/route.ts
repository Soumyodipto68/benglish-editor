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

    const { id } = await params;
    const body = await request.json();

    const content = typeof body.content === "string" ? body.content : undefined;

    const title =
      typeof body.title === "string" ? body.title.trim() : undefined;

    if (content === undefined && title === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const existingWork = await prisma.work.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingWork) {
      return NextResponse.json({ error: "Work not found" }, { status: 404 });
    }

    const work = await prisma.work.update({
      where: {
        id: existingWork.id,
      },
      data: {
        ...(content !== undefined && { content }),
        ...(title !== undefined && { title }),
      },
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Work saved successfully",
      work,
    });
  } catch (error) {
    console.error("Failed to update work:", error);

    return NextResponse.json({ error: "Failed to save work" }, { status: 500 });
  }
}
