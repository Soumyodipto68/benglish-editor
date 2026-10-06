"use client";

import { useEffect, useRef, useState } from "react";

type WorkEditorProps = {
  workId: string;
  initialTitle: string;
  initialContent: string;
};

export default function WorkEditor({
  workId,
  initialTitle,
  initialContent,
}: WorkEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved",
  );

  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

  function scheduleSave(nextTitle: string, nextContent: string) {
    setSaveStatus("saving");

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/works/${workId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: nextTitle,
            content: nextContent,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save");
        }

        setSaveStatus("saved");
      } catch (error) {
        console.error(error);
        setSaveStatus("error");
      }
    }, 800);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    scheduleSave(value, content);
  }

  function handleContentChange(value: string) {
    setContent(value);
    scheduleSave(title, value);
  }

  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-500">Work Editor</p>

          <input
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            className="mt-1 w-full bg-transparent text-3xl font-bold tracking-tight text-white outline-none"
            placeholder="Untitled"
          />
        </div>

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

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <textarea
          value={content}
          onChange={(event) => handleContentChange(event.target.value)}
          placeholder="Start writing..."
          className="min-h-[650px] w-full resize-none bg-transparent p-6 text-base leading-8 text-zinc-100 outline-none placeholder:text-zinc-600"
        />
      </div>
    </>
  );
}