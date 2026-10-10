"use client";
import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";
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
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    // Allow the same file to be selected again.
    event.target.value = "";

    if (!file) return;

    setError("");

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension !== "txt" && extension !== "docx") {
      setError("Please select a .txt or .docx file.");
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
        setError(data.error ?? "Failed to import the file.");
        return;
      }

      router.push(`/work/${data.work.id}`);
      router.refresh();
    } catch (error) {
      console.error("File import failed:", error);
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
        accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        disabled={loading}
        className="hidden"
        aria-label="Choose a TXT or DOCX file to import"
      />

<button
  type="button"
  onClick={() => {
    setError("");
    fileInputRef.current?.click();
  }}
  disabled={loading}
  title="Import TXT or DOCX file"
  className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
>
  {loading ? (
    <>
      <svg
        className="h-4 w-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      Importing file...
    </>
  ) : (
    "Import File"
  )}
</button>


      {error && (
        <p role="alert" className="max-w-xs text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
