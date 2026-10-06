import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import CollectionDashboard from "./CollectionDashboard";

type CollectionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
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
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!collection) {
    notFound();
  }

  return <CollectionDashboard collection={collection} />;
}
