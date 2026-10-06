"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Folder = {
  id: string;
  name: string;
};

type NewWorkButtonProps = {
  folders: Folder[];
  defaultFolderId?: string;
  compact?: boolean;
};

export default function NewWorkButton({
  folders,
  defaultFolderId,
  compact = false,
}: NewWorkButtonProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState(defaultFolderId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openModal() {
    setFolderId(defaultFolderId ?? folders[0]?.id ?? "");
    setTitle("");
    setError("");
    setIsOpen(true);
  }

  function closeModal() {
    if (loading) return;

    setIsOpen(false);
    setTitle("");
    setError("");
  }

  async function createWork() {
    const workTitle = title.trim();

    if (!workTitle) {
      setError("Enter a work title");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/works", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: workTitle,
          folderId: folderId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to create work");
        return;
      }

      setIsOpen(false);
      setTitle("");

      router.push(`/work/${data.work.id}`);
    } catch (error) {
      console.error(error);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={openModal}
        title="New Work"
        aria-label="New Work"
        className={
          compact
            ? "flex h-6 w-6 items-center justify-center rounded text-base text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
            : "rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
        }
      >
        {compact ? "+" : "New Work"}
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">New Work</h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Create a new piece of writing.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="text-lg text-zinc-600 transition hover:text-white disabled:cursor-not-allowed"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Title */}
            <div className="mt-6">
              <label
                htmlFor="work-title"
                className="mb-2 block text-xs font-medium text-zinc-400"
              >
                Title
              </label>

              <input
                id="work-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    createWork();
                  }
                }}
                placeholder="e.g. My new story"
                autoFocus
                disabled={loading}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600 disabled:opacity-50"
              />
            </div>

            {/* Folder */}
            <div className="mt-5">
              <label
                htmlFor="work-folder"
                className="mb-2 block text-xs font-medium text-zinc-400"
              >
                Folder
              </label>

              <select
                id="work-folder"
                value={folderId}
                onChange={(event) => setFolderId(event.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-600 disabled:opacity-50"
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="rounded-lg px-4 py-2 text-sm text-zinc-500 transition hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createWork}
                disabled={loading}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Work"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
