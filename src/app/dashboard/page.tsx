import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import NewWorkButton from "./components/NewWorkButton";

type DashboardPageProps = {
  searchParams: Promise<{
    folder?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const params = await searchParams;
  const folderId = params.folder;

  // Get all folders
  const folders = await prisma.folder.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      isSystem: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Find selected folder
  const selectedFolder = folderId
    ? folders.find((folder) => folder.id === folderId)
    : null;

  // Find Drafts folder
  const draftsFolder = folders.find((folder) => folder.name === "Drafts");

  // Get works
  const works = await prisma.work.findMany({
    where: {
      userId: session.user.id,
      ...(folderId ? { folderId } : {}),
    },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      folder: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Total works
  const totalWorks = await prisma.work.count({
    where: {
      userId: session.user.id,
    },
  });

  // System folders
  const storyFolder = folders.find((folder) => folder.name === "Stories");

  const poemFolder = folders.find((folder) => folder.name === "Poems");

  // Counts
  const [storyCount, poemCount, draftCount] = await Promise.all([
    storyFolder
      ? prisma.work.count({
          where: {
            userId: session.user.id,
            folderId: storyFolder.id,
          },
        })
      : 0,

    poemFolder
      ? prisma.work.count({
          where: {
            userId: session.user.id,
            folderId: poemFolder.id,
          },
        })
      : 0,

    draftsFolder
      ? prisma.work.count({
          where: {
            userId: session.user.id,
            folderId: draftsFolder.id,
          },
        })
      : 0,
  ]);

  const pageTitle = selectedFolder ? selectedFolder.name : "All Works";

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Your workspace</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {pageTitle}
          </h1>

          <p className="mt-2 text-zinc-400">
            {selectedFolder
              ? `Works inside ${selectedFolder.name}.`
              : `Welcome back, ${session.user.name ?? "Writer"}.`}
          </p>
        </div>

        <NewWorkButton
          folders={folders.map((folder) => ({
            id: folder.id,
            name: folder.name,
          }))}
          defaultFolderId={selectedFolder?.id ?? draftsFolder?.id}
        />
      </div>

      {/* Stats */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-500">Total Works</p>

          <p className="mt-2 text-3xl font-bold">{totalWorks}</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-500">Stories</p>

          <p className="mt-2 text-3xl font-bold">{storyCount}</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-500">Poems</p>

          <p className="mt-2 text-3xl font-bold">{poemCount}</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-500">Drafts</p>

          <p className="mt-2 text-3xl font-bold">{draftCount}</p>
        </div>
      </div>

      {/* Works */}
      <section className="mt-10">
        <div>
          <h2 className="text-lg font-semibold">
            {selectedFolder ? `${selectedFolder.name} Works` : "Recent Works"}
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {works.length === 0
              ? "No writings in this section yet."
              : `${works.length} ${works.length === 1 ? "work" : "works"}`}
          </p>
        </div>

        {/* Empty State */}
        {works.length === 0 && (
          <div className="mt-5 flex min-h-48 items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30">
            <div className="text-center">
              <p className="text-sm text-zinc-400">No works yet</p>

              <p className="mt-1 text-xs text-zinc-600">
                Click &quot;+ New Work&quot; to start writing.
              </p>
            </div>
          </div>
        )}

        {/* Works Grid */}
        {works.length > 0 && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {works.map((work) => (
              <div
                key={work.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-zinc-100">{work.title}</h3>

                  <span className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
                    {work.folder.name}
                  </span>
                </div>

                <p className="mt-3 line-clamp-3 text-sm text-zinc-500">
                  {work.content || "No content yet."}
                </p>

                <p className="mt-4 text-xs text-zinc-600">
                  Updated {work.updatedAt.toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
