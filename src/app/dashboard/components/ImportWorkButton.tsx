
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ImportWorkButtonProps = {
  defaultFolderId?: string;
};

export default function ImportWorkButton({
  defaultFolderId,
}: ImportWorkButtonProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    // Allow selecting the same file again after an import attempt.
    event.target.value = "";

    if (!file) return;

    setError("");

    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("Please select a .txt file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("File size must be 2 MB or less.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      if (defaultFolderId) {
        formData.append("folderId", defaultFolderId);
      }

      const response = await fetch("/api/works/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to import TXT file.");
        return;
      }

      router.push(`/work/${data.work.id}`);
      router.refresh();
    } catch (error) {
      console.error("TXT import failed:", error);
      setError("Something went wrong while importing the file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        onChange={handleFileChange}
        disabled={loading}
        className="hidden"
        aria-label="Choose a TXT file to import"
      />

      <button
        type="button"
        onClick={() => {
          setError("");
          fileInputRef.current?.click();
        }}
        disabled={loading}
        title="Import TXT file"
        className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Importing..." : "Import TXT"}
      </button>

      {error && (
        <p role="alert" className="max-w-xs text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
