"use client";

import ExportWorkButton from "./ExportWorkButton";

type WorkEditorHeaderProps = {
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  bengaliTyping: boolean;
  onToggleBengaliTyping: () => void;
  saveStatus: "saved" | "saving" | "error";
};

export default function WorkEditorHeader({
  title,
  content,
  onTitleChange,
  bengaliTyping,
  onToggleBengaliTyping,
  saveStatus,
}: WorkEditorHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-500">Work Editor</p>

        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="mt-1 w-full bg-transparent text-3xl font-bold tracking-tight text-white outline-none"
          placeholder="Untitled"
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <ExportWorkButton title={title} content={content} />

        <button
          type="button"
          aria-pressed={bengaliTyping}
          onClick={onToggleBengaliTyping}
          className={`rounded-full border px-3 py-1.5 text-xs transition ${
            bengaliTyping
              ? "border-emerald-900 bg-emerald-950/50 text-emerald-300"
              : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          বাংলা {bengaliTyping ? "On" : "Off"}
        </button>

        <span
          role="status"
          className={`rounded-full px-3 py-1.5 text-xs ${
            saveStatus === "saved"
              ? "bg-zinc-900 text-green-500"
              : saveStatus === "saving"
                ? "bg-zinc-900 text-yellow-600"
                : "bg-red-950 text-yellow-600"
          }`}
        >
          {saveStatus === "saved"
            ? "Saved"
            : saveStatus === "saving"
              ? "Saving..."
              : "Save failed"}
        </span>
      </div>
    </div>
  );
}
