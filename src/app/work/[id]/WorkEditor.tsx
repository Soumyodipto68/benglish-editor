"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { transliterateBengali } from "@/lib/transliteration/bengali";

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
  const [bengaliTyping, setBengaliTyping] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved",
  );

  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaret = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (pendingCaret.current === null || !textareaRef.current) {
      return;
    }

    textareaRef.current.setSelectionRange(
      pendingCaret.current,
      pendingCaret.current,
    );
    pendingCaret.current = null;
  }, [content]);

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

  function handleContentKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      !bengaliTyping ||
      event.nativeEvent.isComposing ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.currentTarget.selectionStart !==
        event.currentTarget.selectionEnd
    ) {
      return;
    }

    const delimiter =
      event.key === "Enter"
        ? "\n"
        : [" ", ",", ".", "?", "!", ";", ":", ")", "]", "}", "'", '"'].includes(
              event.key,
            )
          ? event.key
          : null;

    if (!delimiter) {
      return;
    }

    const cursor = event.currentTarget.selectionStart;
    const beforeCursor = content.slice(0, cursor);
    const word = beforeCursor.match(/[A-Za-z]+$/)?.[0];

    if (!word) {
      return;
    }

    const convertedWord = transliterateBengali(word);
    if (convertedWord === word) {
      return;
    }

    event.preventDefault();

    const wordStart = cursor - word.length;
    const nextContent =
      content.slice(0, wordStart) +
      convertedWord +
      delimiter +
      content.slice(cursor);

    pendingCaret.current = wordStart + convertedWord.length + delimiter.length;
    handleContentChange(nextContent);
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

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-pressed={bengaliTyping}
            title="Convert phonetic English to Bengali at word boundaries"
            onClick={() => setBengaliTyping((enabled) => !enabled)}
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

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => handleContentChange(event.target.value)}
          onKeyDown={handleContentKeyDown}
          placeholder="Start writing..."
          className="min-h-[650px] w-full resize-none bg-transparent p-6 text-base leading-8 text-zinc-100 outline-none placeholder:text-zinc-600"
        />
      </div>
    </>
  );
}