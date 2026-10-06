import { prisma } from "@/lib/prisma";

export async function getWorkspaceFolders(userId: string) {
  const folders = await prisma.folder.findMany({
    where: {
      userId,
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

  const folderOrder = ["Stories", "Poems", "Drafts", "Others"];

  return [...folders].sort((a, b) => {
    const aIndex = folderOrder.indexOf(a.name);
    const bIndex = folderOrder.indexOf(b.name);

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    return a.name.localeCompare(b.name);
  });
}
