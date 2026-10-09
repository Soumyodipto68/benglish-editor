"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type WorkEditorProps = {
  workId: string;
  initialTitle: string;
  initialContent: string;
};

type SuggestionRange = {
  start: number;
  end: number;
  source: string;
};

type ActiveWord = {
  start: number;
  roman: string;
  converted: string;
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

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionRange, setSuggestionRange] =
    useState<SuggestionRange | null>(null);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transliterationTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const contentRef = useRef(initialContent);
  const activeWordRef = useRef<ActiveWord | null>(null);
  const requestIdRef = useRef(0);

  // Avoid sending repeat requests for words already processed.
  const candidateCache = useRef(new Map<string, string[]>());

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      if (transliterationTimeout.current) {
        clearTimeout(transliterationTimeout.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (pendingCaret.current === null || !textareaRef.current) return;

    const position = pendingCaret.current;
    textareaRef.current.setSelectionRange(position, position);
    pendingCaret.current = null;
  }, [content]);

  function scheduleSave(nextTitle: string, nextContent: string) {
    setSaveStatus("saving");

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/works/${workId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: nextTitle,
            content: nextContent,
          }),
        });

        if (!response.ok) throw new Error("Failed to save");
        setSaveStatus("saved");
      } catch (error) {
        console.error(error);
        setSaveStatus("error");
      }
    }, 800);
  }

  function updateContent(value: string) {
    contentRef.current = value;
    setContent(value);
    scheduleSave(title, value);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    scheduleSave(value, contentRef.current);
  }

  async function getCandidates(word: string): Promise<string[]> {
    const cacheKey = word.toLowerCase();
    const cached = candidateCache.current.get(cacheKey);

    if (cached) return cached;

    const response = await fetch("/api/transliterate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        word,
        language: "bn",
      }),
    });

    if (!response.ok) {
      throw new Error("Transliteration request failed");
    }

    const result: { candidates?: string[]; converted?: string } =
      await response.json();

    const values = [
      ...new Set(
        (result.candidates ?? [result.converted ?? word]).filter(
          (candidate) => typeof candidate === "string" && candidate.length > 0,
        ),
      ),
    ];

    candidateCache.current.set(cacheKey, values);
    return values;
  }

  function scheduleAutomaticTransliteration(value: string) {
    if (transliterationTimeout.current) {
      clearTimeout(transliterationTimeout.current);
    }

    if (!bengaliTyping) return;

    const match = value.match(/[A-Za-z]+$/);
    if (!match || match[0].length < 2) return;

    const word = match[0];
    const start = value.length - word.length;
    const requestContent = value;
    const requestId = ++requestIdRef.current;

    // Reduced from 650 ms to 250 ms.
    transliterationTimeout.current = setTimeout(async () => {
      const textarea = textareaRef.current;

      if (
        !textarea ||
        textarea.selectionStart !== requestContent.length ||
        textarea.selectionEnd !== requestContent.length ||
        contentRef.current !== requestContent
      ) {
        return;
      }

      try {
        const candidates = await getCandidates(word);

        if (
          requestId !== requestIdRef.current ||
          contentRef.current !== requestContent
        ) {
          return;
        }

        // Always offer the original Roman word as a choice.
        const options = [...new Set([...candidates, word])];
        const converted = candidates[0] ?? word;

        setSuggestions(options);

        if (converted !== word) {
          const nextContent = requestContent.slice(0, start) + converted;

          activeWordRef.current = {
            start,
            roman: word,
            converted,
          };

          setSuggestionRange({
            start,
            end: start + converted.length,
            source: word,
          });

          pendingCaret.current = start + converted.length;
          updateContent(nextContent);
        } else {
          setSuggestionRange({
            start,
            end: start + word.length,
            source: word,
          });
        }
      } catch (error) {
        console.error(error);
      }
    }, 250);
  }

  function handleContentChange(value: string) {
    const activeWord = activeWordRef.current;

    // Let users continue a Roman word even after it was converted.
    if (activeWord) {
      const prefix = contentRef.current.slice(0, activeWord.start);
      const convertedPrefix = prefix + activeWord.converted;

      if (value.startsWith(convertedPrefix)) {
        const appendedText = value.slice(convertedPrefix.length);

        if (/^[A-Za-z]+$/.test(appendedText)) {
          const restored = prefix + activeWord.roman + appendedText;

          activeWordRef.current = null;
          setSuggestions([]);
          setSuggestionRange(null);

          pendingCaret.current =
            prefix.length + activeWord.roman.length + appendedText.length;

          requestIdRef.current++;
          updateContent(restored);
          scheduleAutomaticTransliteration(restored);
          return;
        }
      }

      activeWordRef.current = null;
    }

    if (transliterationTimeout.current) {
      clearTimeout(transliterationTimeout.current);
    }

    requestIdRef.current++;
    setSuggestions([]);
    setSuggestionRange(null);

    updateContent(value);
    scheduleAutomaticTransliteration(value);
  }

  function chooseSuggestion(candidate: string) {
    if (!suggestionRange) return;

    const { start, end, source } = suggestionRange;
    const current = contentRef.current;

    // Don't replace text if the suggestion refers to an outdated word.
    if (
      current.slice(start, end) !== (activeWordRef.current?.converted ?? source)
    ) {
      if (current.slice(start, end) !== source) return;
    }

    const nextContent =
      current.slice(0, start) + candidate + current.slice(end);

    activeWordRef.current = {
      start,
      roman: source,
      converted: candidate,
    };

    requestIdRef.current++;
    if (transliterationTimeout.current) {
      clearTimeout(transliterationTimeout.current);
    }

    setSuggestions([]);
    setSuggestionRange(null);
    pendingCaret.current = start + candidate.length;
    updateContent(nextContent);

    textareaRef.current?.focus();
  }

  async function handleContentKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      !bengaliTyping ||
      event.nativeEvent.isComposing ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.currentTarget.selectionStart !== event.currentTarget.selectionEnd
    ) {
      return;
    }

    const delimiters = [
      " ",
      ",",
      ".",
      "?",
      "!",
      ";",
      ":",
      ")",
      "]",
      "}",
      "'",
      '"',
      "Enter",
    ];

    if (!delimiters.includes(event.key)) return;

    const cursor = event.currentTarget.selectionStart;
    const originalContent = contentRef.current;
    const match = originalContent.slice(0, cursor).match(/[A-Za-z]+$/);

    if (!match) return;

    const word = match[0];
    const wordStart = cursor - word.length;
    const delimiter = event.key === "Enter" ? "\n" : event.key;
    const requestId = ++requestIdRef.current;

    if (transliterationTimeout.current) {
      clearTimeout(transliterationTimeout.current);
    }

    event.preventDefault();

    try {
      const candidates = await getCandidates(word);

      if (
        requestId !== requestIdRef.current ||
        contentRef.current !== originalContent
      ) {
        return;
      }

      const converted = candidates[0] ?? word;
      const nextContent =
        originalContent.slice(0, wordStart) +
        converted +
        delimiter +
        originalContent.slice(cursor);

      activeWordRef.current = null;
      setSuggestions([]);
      setSuggestionRange(null);
      pendingCaret.current = wordStart + converted.length + delimiter.length;

      updateContent(nextContent);
    } catch (error) {
      console.error(error);

      if (
        requestId === requestIdRef.current &&
        contentRef.current === originalContent
      ) {
        const nextContent =
          originalContent.slice(0, cursor) +
          delimiter +
          originalContent.slice(cursor);

        pendingCaret.current = cursor + delimiter.length;
        updateContent(nextContent);
      }
    }
  }

  function toggleBengaliTyping() {
    if (transliterationTimeout.current) {
      clearTimeout(transliterationTimeout.current);
    }

    requestIdRef.current++;
    activeWordRef.current = null;
    setSuggestions([]);
    setSuggestionRange(null);
    setBengaliTyping((enabled) => !enabled);
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
            onClick={toggleBengaliTyping}
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

        {suggestions.length > 0 && suggestionRange && (
          <div className="border-t border-zinc-800 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-400">
                Suggestions for{" "}
                <span className="font-medium text-zinc-200">
                  {suggestionRange.source}
                </span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setSuggestions([]);
                  setSuggestionRange(null);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Close
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestions.map((candidate, index) => {
                const isEnglish = candidate === suggestionRange.source;

                return (
                  <button
                    key={`${candidate}-${index}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseSuggestion(candidate)}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      isEnglish
                        ? "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
                        : "border-emerald-900/70 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-950/70"
                    }`}
                  >
                    <span>{candidate}</span>
                    {isEnglish && (
                      <span className="ml-2 text-xs text-zinc-500">
                        Keep English
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
