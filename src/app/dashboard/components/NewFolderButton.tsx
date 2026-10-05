"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type NewFolderButtonProps = {
  parentId: string;
};

export default function NewFolderButton({ parentId }: NewFolderButtonProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createFolder() {
    const folderName = name.trim();

    if (!folderName) {
      setError("Enter a folder name");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: folderName,
          parentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to create folder");
        return;
      }

      setName("");
      setIsOpen(false);

      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    if (loading) return;

    setName("");
    setError("");
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 opacity-0 transition hover:bg-zinc-800 hover:text-white group-hover:opacity-100"
        title="New Folder"
        aria-label="New Folder"
      >
        +
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={closeModal}
        className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-white"
        title="Cancel"
        aria-label="Cancel"
      >
        ×
      </button>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
          <h2 className="text-base font-semibold text-white">New Folder</h2>

          <p className="mt-1 text-xs text-zinc-500">
            Create a folder inside Others.
          </p>

          <input
            autoFocus
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                createFolder();
              }

              if (event.key === "Escape") {
                closeModal();
              }
            }}
            placeholder="Folder name"
            maxLength={50}
            className="mt-4 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={createFolder}
              disabled={loading}
              className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
