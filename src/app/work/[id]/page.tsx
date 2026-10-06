import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Sidebar from "@/app/dashboard/components/Sidebar";
import { getWorkspaceFolders } from "@/lib/workspace";
import WorkEditor from "./WorkEditor";

type WorkPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkPage({ params }: WorkPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const { id } = await params;

  const work = await prisma.work.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      content: true,
      folderId: true,
    },
  });

  if (!work) {
    notFound();
  }

  const folders = await getWorkspaceFolders(session.user.id);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar
        folders={folders}
        selectedFolderId={work.folderId}
        selectedWorkId={work.id}
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />

      <main className="min-w-0 flex-1">
        <div className="p-8">
          <WorkEditor
            workId={work.id}
            initialTitle={work.title}
            initialContent={work.content}
          />
        </div>
      </main>
    </div>
  );
}
