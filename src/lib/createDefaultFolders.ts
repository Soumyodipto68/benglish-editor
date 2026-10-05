import { prisma } from "@/lib/prisma";

const DEFAULT_FOLDERS = ["Stories", "Poems", "Drafts", "Others"];

export async function createDefaultFolders(userId: string) {
  const existingFolder = await prisma.folder.findFirst({
    where: {
      userId,
    },
  });

  if (existingFolder) {
    return;
  }

  await prisma.folder.createMany({
    data: DEFAULT_FOLDERS.map((name) => ({
      name,
      userId,
      isSystem: true,
    })),
  });
}
