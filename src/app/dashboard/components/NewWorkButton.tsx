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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openModal() {
    setFolderId(defaultFolderId ?? "");
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
      <button
        type="button"
        onClick={openModal}
        className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
      >
        + New Work
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">New Work</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Create a new piece of writing.
            </p>

            {/* Title */}
            <div className="mt-5">
              <label className="mb-2 block text-sm text-zinc-400">Title</label>

              <input
                autoFocus
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    createWork();
                  }

                  if (event.key === "Escape") {
                    closeModal();
                  }
                }}
                placeholder="My new work"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </div>

            {/* Folder */}
            <div className="mt-4">
              <label className="mb-2 block text-sm text-zinc-400">Folder</label>

              <select
                value={folderId}
                onChange={(event) => setFolderId(event.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-600"
              >
                <option value="">Drafts (Default)</option>

                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="rounded-md px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createWork}
                disabled={loading}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
