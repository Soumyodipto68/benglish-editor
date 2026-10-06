import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NewCollectionButton from "./NewCollectionButton";

type CollectionsProps = {
  userId: string;
};

export default async function Collections({ userId }: CollectionsProps) {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <section className="border-t border-zinc-800 py-3">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-400">
          COLLECTIONS
        </h2>
        <NewCollectionButton />
      </div>
      <div className="mt-2">
        {collections.length === 0 ? (
          <p className="px-4 py-1.5 text-xs text-zinc-600">
            No collections yet.
          </p>
        ) : (
          collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/dashboard/collections/${collection.id}`}
              className="block truncate px-4 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              {collection.name}
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
