"use client";

type WorkEditorHeaderProps = {
  title: string;
  onTitleChange: (value: string) => void;
  bengaliTyping: boolean;
  onToggleBengaliTyping: () => void;
  saveStatus: "saved" | "saving" | "error";
};

export default function WorkEditorHeader({
  title,
  onTitleChange,
  bengaliTyping,
  onToggleBengaliTyping,
  saveStatus,
}: WorkEditorHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-500">Work Editor</p>

        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="mt-1 w-full bg-transparent text-3xl font-bold tracking-tight text-white outline-none"
          placeholder="Untitled"
        />
      </div>

      <div className="flex items-center gap-3">
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
