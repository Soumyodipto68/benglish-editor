import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Sidebar from "./components/Sidebar";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const folders = await prisma.folder.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      parentId: true,
      isSystem: true,
      children: {
        select: {
          id: true,
          name: true,
          parentId: true,
          isSystem: true,
          children: {
            select: {
              id: true,
              name: true,
              parentId: true,
              isSystem: true,
              children: {
                select: {
                  id: true,
                  name: true,
                  parentId: true,
                  isSystem: true,
                },
              },
              works: {
                select: {
                  id: true,
                  title: true,
                },
                orderBy: {
                  updatedAt: "desc",
                },
              },
            },
            orderBy: {
              name: "asc",
            },
          },
          works: {
            select: {
              id: true,
              title: true,
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      },
      works: {
        select: {
          id: true,
          title: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const folderOrder = [
    "Stories",
    "Poems",
    "Drafts",
    "Others",
  ];

  const sortedFolders = [...folders].sort((a, b) => {
    const aIndex = folderOrder.indexOf(a.name);
    const bIndex = folderOrder.indexOf(b.name);

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar
        folders={sortedFolders}
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />

      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
