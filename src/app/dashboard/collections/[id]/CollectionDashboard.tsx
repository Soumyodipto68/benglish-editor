"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Work = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

type CollectionWork = {
  order: number;
  work: Work;
};

type CollectionDashboardProps = {
  collection: {
    id: string;
    name: string;
    works: CollectionWork[];
  };
};

export default function CollectionDashboard({
  collection,
}: CollectionDashboardProps) {
  const router = useRouter();

  const [collectionName, setCollectionName] = useState(collection.name);

  const [works, setWorks] = useState(collection.works);

  const [showAddWork, setShowAddWork] = useState(false);

  const [availableWorks, setAvailableWorks] = useState<Work[]>([]);

  const [loadingWorks, setLoadingWorks] = useState(false);

  const [addingWorkId, setAddingWorkId] = useState<string | null>(null);

  const [removingWorkId, setRemovingWorkId] = useState<string | null>(null);

  const [reorderingWorkId, setReorderingWorkId] = useState<string | null>(null);

  const [showRename, setShowRename] = useState(false);

  const [renameValue, setRenameValue] = useState(collection.name);

  const [renaming, setRenaming] = useState(false);

  const [showDelete, setShowDelete] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  /* ADD WORK */

  async function openAddWork() {
    setShowAddWork(true);
    setLoadingWorks(true);
    setError("");

    try {
      const response = await fetch(
        `/api/collections/${collection.id}/available-works`,
      );

      if (!response.ok) {
        throw new Error("Failed to load works");
      }

      const data = await response.json();

      setAvailableWorks(data.works);
    } catch (error) {
      console.error(error);
      setError("Failed to load works");
    } finally {
      setLoadingWorks(false);
    }
  }

  async function addWork(work: Work) {
    try {
      setAddingWorkId(work.id);

      const response = await fetch(`/api/collections/${collection.id}/works`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workId: work.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to add work");
      }

      setWorks((current) => [...current, data.collectionWork]);

      setAvailableWorks((current) =>
        current.filter((item) => item.id !== work.id),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setAddingWorkId(null);
    }
  }

  /* REMOVE WORK */

  async function removeWork(workId: string) {
    try {
      setRemovingWorkId(workId);

      const response = await fetch(
        `/api/collections/${collection.id}/works/${workId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to remove work");
      }

      setWorks((current) =>
        current
          .filter(({ work }) => work.id !== workId)
          .map((item, index) => ({
            ...item,
            order: index,
          })),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setRemovingWorkId(null);
    }
  }

  /* REORDER */

  async function moveWork(workId: string, direction: "up" | "down") {
    const currentIndex = works.findIndex(({ work }) => work.id === workId);

    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= works.length) {
      return;
    }

    const currentWork = works[currentIndex];
    const targetWork = works[targetIndex];

    try {
      setReorderingWorkId(workId);
      setError("");

      const response = await fetch(
        `/api/collections/${collection.id}/reorder`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workId,
            direction,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to reorder work");
      }

      setWorks((current) => {
        const updated = [...current];

        updated[currentIndex] = {
          ...targetWork,
          order: currentWork.order,
        };

        updated[targetIndex] = {
          ...currentWork,
          order: targetWork.order,
        };

        return updated;
      });
    } catch (error) {
      console.error(error);
      setError("Failed to reorder work");
    } finally {
      setReorderingWorkId(null);
    }
  }

  /* RENAME */

  async function renameCollection() {
    const newName = renameValue.trim();

    if (!newName) {
      setError("Collection name cannot be empty");
      return;
    }

    try {
      setRenaming(true);
      setError("");

      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to rename collection");
      }

      setCollectionName(data.collection.name);
      setRenameValue(data.collection.name);
      setShowRename(false);

      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Failed to rename collection");
    } finally {
      setRenaming(false);
    }
  }

  /* DELETE */

  async function deleteCollection() {
    try {
      setDeleting(true);
      setError("");

      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete collection");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Failed to delete collection");
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}

      <div className="border-b border-zinc-800 px-8 py-6">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 transition hover:text-white"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-sm text-zinc-500">Collection</p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {collectionName}
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              {works.length} {works.length === 1 ? "work" : "works"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRenameValue(collectionName);
                setError("");
                setShowRename(true);
              }}
              className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              Rename
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowDelete(true);
              }}
              className="rounded-lg border border-red-500/20 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
            >
              Delete
            </button>

            <button
              type="button"
              onClick={openAddWork}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              + Add Work
            </button>
          </div>
        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="px-8 pt-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Works */}

      <main className="p-8">
        {works.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center">
            <p className="text-zinc-500">No works in this collection yet.</p>

            <p className="mt-2 text-sm text-zinc-600">
              Add existing works to this collection.
            </p>

            <button
              type="button"
              onClick={openAddWork}
              className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              + Add Work
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {works.map(({ work }, index) => (
              <div
                key={work.id}
                className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition hover:border-zinc-700 hover:bg-zinc-900"
              >
                {/* Order */}

                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => moveWork(work.id, "up")}
                    disabled={index === 0 || reorderingWorkId !== null}
                    className="px-2 text-xs text-zinc-600 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    onClick={() => moveWork(work.id, "down")}
                    disabled={
                      index === works.length - 1 || reorderingWorkId !== null
                    }
                    className="px-2 text-xs text-zinc-600 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>

                {/* Work */}

                <Link href={`/work/${work.id}`} className="min-w-0 flex-1">
                  <h2 className="font-medium text-zinc-100">{work.title}</h2>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
                    {work.content || "No content yet."}
                  </p>
                </Link>

                {/* Remove */}

                <button
                  type="button"
                  onClick={() => removeWork(work.id)}
                  disabled={
                    removingWorkId === work.id || reorderingWorkId !== null
                  }
                  className="shrink-0 rounded-md px-3 py-2 text-xs text-zinc-600 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {removingWorkId === work.id ? "Removing..." : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Work Modal */}

      {showAddWork && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAddWork(false);
            }
          }}
        >
          <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div>
                <h2 className="font-semibold text-white">Add Work</h2>

                <p className="mt-1 text-xs text-zinc-600">
                  Select an existing work.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddWork(false)}
                className="text-lg text-zinc-600 transition hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-3">
              {loadingWorks ? (
                <p className="px-3 py-8 text-center text-sm text-zinc-600">
                  Loading works...
                </p>
              ) : availableWorks.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-zinc-600">
                  No available works.
                </p>
              ) : (
                <div className="space-y-1">
                  {availableWorks.map((work) => (
                    <div
                      key={work.id}
                      className="flex items-center justify-between rounded-lg px-3 py-3 transition hover:bg-zinc-900"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-zinc-200">
                          {work.title}
                        </p>

                        <p className="mt-1 line-clamp-1 text-xs text-zinc-600">
                          {work.content || "No content yet."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => addWork(work)}
                        disabled={addingWorkId === work.id}
                        className="ml-4 shrink-0 rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {addingWorkId === work.id ? "Adding..." : "Add"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}

      {showRename && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowRename(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">
              Rename Collection
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Change the name of this collection.
            </p>

            <input
              type="text"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  renameCollection();
                }
              }}
              autoFocus
              disabled={renaming}
              className="mt-5 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600 disabled:opacity-50"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRename(false)}
                disabled={renaming}
                className="rounded-lg px-4 py-2 text-sm text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={renameCollection}
                disabled={renaming}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {renaming ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}

      {showDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowDelete(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">
              Delete Collection?
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              This will delete{" "}
              <span className="text-zinc-300">{collectionName}</span> and remove
              its works from the collection.
            </p>

            <p className="mt-2 text-sm text-zinc-600">
              Your actual works will not be deleted.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                disabled={deleting}
                className="rounded-lg px-4 py-2 text-sm text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deleteCollection}
                disabled={deleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-400 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Collection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
