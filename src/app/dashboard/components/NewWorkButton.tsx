"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Folder = {
  id: string;
  name: string;
};

type NewWorkButtonProps = {
  folders: Folder[];
  defaultFolderId?: string;
};

export default function NewWorkButton({
  folders,
  defaultFolderId,
}: NewWorkButtonProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState(defaultFolderId ?? "");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  function openModal() {
    setError("");
    setTitle("");
    setFolderId(defaultFolderId ?? "");
    setIsOpen(true);
  }

  function closeModal() {
    if (isCreating) return;

    setIsOpen(false);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Please enter a title.");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const response = await fetch("/api/works", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          folderId: folderId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to create work.");
        return;
      }

      setIsOpen(false);

      // Refresh server components
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <>
      {/* New Work Button */}
      <button
        type="button"
        onClick={openModal}
        className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
      >
        + New Work
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            {/* Header */}
            <div>
              <h2 className="text-xl font-semibold text-white">New Work</h2>

              <p className="mt-1 text-sm text-zinc-500">
                Start a new piece of writing.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Title */}
              <div>
                <label
                  htmlFor="work-title"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Title
                </label>

                <input
                  id="work-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="My first Bengali story"
                  autoFocus
                  disabled={isCreating}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                />
              </div>

              {/* Folder */}
              <div>
                <label
                  htmlFor="work-folder"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Folder
                </label>

                <select
                  id="work-folder"
                  value={folderId}
                  onChange={(event) => setFolderId(event.target.value)}
                  disabled={isCreating}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-600"
                >
                  <option value="">Drafts</option>

                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Error */}
              {error && (
                <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isCreating}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Work"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
