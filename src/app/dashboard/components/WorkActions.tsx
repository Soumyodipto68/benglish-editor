"use client";

import { useState } from "react";

type WorkActionsProps = {
  workId: string;
  initialTitle: string;
};

export default function WorkActions({
  workId,
  initialTitle,
}: WorkActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleRename() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setTitle(initialTitle);
      setIsEditing(false);
      return;
    }

    if (trimmedTitle === initialTitle) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(`/api/works/${workId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename work");
      }

      setTitle(trimmedTitle);
      setIsEditing(false);

      window.location.reload();
    } catch (error) {
      console.error("Failed to rename work:", error);

      setTitle(initialTitle);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${initialTitle}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/works/${workId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete work");
      }

      window.location.reload();
    } catch (error) {
      console.error("Failed to delete work:", error);
      setIsDeleting(false);
    }
  }

  function handleCancel() {
    setTitle(initialTitle);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleRename();
            }

            if (event.key === "Escape") {
              handleCancel();
            }
          }}
          disabled={isSaving}
          className="w-36 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-zinc-500"
        />

        <button
          type="button"
          onClick={handleRename}
          disabled={isSaving}
          className="text-xs text-green-500 hover:text-green-400 disabled:opacity-50"
        >
          {isSaving ? "..." : "Save"}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        disabled={isDeleting}
        className="rounded-md px-2 py-1 text-xs text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
      >
        Rename
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-md px-2 py-1 text-xs text-red-500 transition hover:bg-red-950/40 hover:text-red-400 disabled:opacity-50"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
