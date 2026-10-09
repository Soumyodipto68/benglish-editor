
"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

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

type PopupPosition = {
  top: number;
  left: number;
};

export default function WorkEditor({
  workId,
  initialTitle,
  initialContent,
}: WorkEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [bengaliTyping, setBengaliTyping] = useState(true);

  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "error"
  >("saved");

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionRange, setSuggestionRange] =
    useState<SuggestionRange | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState(0);

  const [popupPosition, setPopupPosition] = useState<PopupPosition>({
    top: 40,
    left: 24,
  });

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transliterationTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorBodyRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const pendingCaret = useRef<number | null>(null);
  const contentRef = useRef(initialContent);
  const titleRef = useRef(initialTitle);
  const activeWordRef = useRef<ActiveWord | null>(null);
  const requestIdRef = useRef(0);
  const bengaliTypingRef = useRef(true);

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

  function clearSuggestions() {
    setSuggestions([]);
    setSuggestionRange(null);
    setActiveSuggestion(0);
  }

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
    scheduleSave(titleRef.current, value);
  }

  function handleTitleChange(value: string) {
    titleRef.current = value;
    setTitle(value);
    scheduleSave(value, contentRef.current);
  }

  async function getCandidates(word: string): Promise<string[]> {
    const cacheKey = `bn:${word.toLowerCase()}`;
    const cached = candidateCache.current.get(cacheKey);

    if (cached) return cached;

    const response = await fetch("/api/transliterate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, language: "bn" }),
    });

    if (!response.ok) {
      throw new Error("Transliteration request failed");
    }

    const result: {
      candidates?: string[];
      converted?: string;
    } = await response.json();

    const values = [
      ...new Set(
        (result.candidates ?? [result.converted ?? word]).filter(
          (candidate) =>
            typeof candidate === "string" && candidate.length > 0,
        ),
      ),
    ];

    if (!values.includes(word)) values.push(word);

    candidateCache.current.set(cacheKey, values);
    return values;
  }

  function replaceWord(
    start: number,
    roman: string,
    converted: string,
    expectedFollowingCharacter?: string,
  ) {
    const current = contentRef.current;

    // Never replace text that has changed since the request began.
    if (current.slice(start, start + roman.length) !== roman) return;

    const end = start + roman.length;
    const nextCharacter = current[end] ?? "";

    // Don't convert a partial word if the user is still typing it.
    if (/[A-Za-z]/.test(nextCharacter)) return;

    if (
      expectedFollowingCharacter !== undefined &&
      nextCharacter !== expectedFollowingCharacter
    ) {
      return;
    }

    const nextContent =
      current.slice(0, start) +
      converted +
      current.slice(end);

    const textarea = textareaRef.current;
    const oldCaret = textarea?.selectionStart ?? current.length;
    const delta = converted.length - roman.length;

    if (oldCaret >= end) {
      pendingCaret.current = oldCaret + delta;
    }

    activeWordRef.current = {
      start,
      roman,
      converted,
    };

    updateContent(nextContent);
  }

  // Handles the current Roman word after the user pauses typing.
  function scheduleAutomaticTransliteration(value: string) {
    if (transliterationTimeout.current) {
      clearTimeout(transliterationTimeout.current);
    }

    if (!bengaliTypingRef.current) return;

    const match = value.match(/[A-Za-z]+$/);

    if (!match || match[0].length < 2) return;

    const word = match[0];
    const start = value.length - word.length;
    const requestId = ++requestIdRef.current;

    transliterationTimeout.current = setTimeout(async () => {
      const textarea = textareaRef.current;

      if (
        !textarea ||
        textarea.selectionStart !== value.length ||
        textarea.selectionEnd !== value.length ||
        contentRef.current !== value
      ) {
        return;
      }

      try {
        const candidates = await getCandidates(word);
        const current = contentRef.current;

        if (
          requestId !== requestIdRef.current ||
          !bengaliTypingRef.current
        ) {
          return;
        }

        // The user may have typed a space while the request was running.
        // In that case, let the boundary handler deal with the word.
        if (current.slice(start, start + word.length) !== word) return;
        if (/[A-Za-z]/.test(current[start + word.length] ?? "")) return;

        const options = [...new Set([...candidates, word])];
        const converted = candidates[0] ?? word;

        setSuggestions(options);
        setActiveSuggestion(0);

        if (converted !== word) {
          const nextContent =
            current.slice(0, start) +
            converted +
            current.slice(start + word.length);

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

          const caret = textarea.selectionStart;
          pendingCaret.current =
            caret >= start + word.length
              ? caret + converted.length - word.length
              : caret;

          updateContent(nextContent);
        } else {
          setSuggestionRange({
            start,
            end: start + word.length,
            source: word,
          });
        }
      } catch (error) {
        console.error("Transliteration failed:", error);
      }
    }, 300);
  }

  // Convert a completed Roman word without blocking Space or Enter.
  async function convertWordBeforeDelimiter(
    value: string,
    cursor: number,
  ) {
    if (!bengaliTypingRef.current || cursor < 2) return;

    const beforeCursor = value.slice(0, cursor);
    const match = beforeCursor.match(/[A-Za-z]+(?=[ \n,.;?!:]$)/);

    if (!match) return;

    const word = match[0];
    const start = cursor - 1 - word.length;
    const delimiter = value[cursor - 1];

    if (start < 0) return;

    const requestId = requestIdRef.current;

    try {
      const candidates = await getCandidates(word);

      if (!bengaliTypingRef.current) return;

      // Verify the same word and delimiter still exist.
      const current = contentRef.current;

      if (
        current.slice(start, start + word.length) !== word ||
        current[start + word.length] !== delimiter
      ) {
        return;
      }

      const converted = candidates[0] ?? word;

      if (converted === word) return;

      const nextContent =
        current.slice(0, start) +
        converted +
        current.slice(start + word.length);

      const textarea = textareaRef.current;
      const caret = textarea?.selectionStart ?? cursor;

      pendingCaret.current =
        caret >= start + word.length
          ? caret + converted.length - word.length
          : caret;

      activeWordRef.current = {
        start,
        roman: word,
        converted,
      };

      // This request is allowed to finish after more typing, provided
      // the exact Roman word and its delimiter are still unchanged.
      void requestId;

      updateContent(nextContent);
    } catch (error) {
      console.error("Boundary transliteration failed:", error);
    }
  }

  function handleContentChange(value: string) {
    const textarea = textareaRef.current;
    const cursor = textarea?.selectionStart ?? value.length;
    const previous = contentRef.current;
    const activeWord = activeWordRef.current;

    // If the user continues typing a Roman word after it was converted,
    // restore the Roman spelling before processing the new input.
    if (activeWord) {
      const prefix = previous.slice(0, activeWord.start);
      const convertedPrefix = prefix + activeWord.converted;

      if (value.startsWith(convertedPrefix)) {
        const appendedText = value.slice(convertedPrefix.length);

        if (/^[A-Za-z]+$/.test(appendedText)) {
          const restored =
            prefix + activeWord.roman + appendedText;

          activeWordRef.current = null;
          requestIdRef.current++;
          clearSuggestions();

          pendingCaret.current =
            prefix.length + activeWord.roman.length + appendedText.length;

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
    clearSuggestions();

    updateContent(value);

    // Normal typing is already complete before this async operation starts.
    if (
      cursor > 0 &&
      /[ \n,.;?!:]$/.test(value.slice(0, cursor)) &&
      value.length >= previous.length
    ) {
      void convertWordBeforeDelimiter(value, cursor);
    }

    scheduleAutomaticTransliteration(value);
  }

  function chooseSuggestion(candidate: string) {
    if (!suggestionRange) return;

    const { start, end, source } = suggestionRange;
    const current = contentRef.current;

    const expected = activeWordRef.current?.converted ?? source;

    if (current.slice(start, end) !== expected) {
      if (current.slice(start, end) !== source) return;
    }

    const nextContent =
      current.slice(0, start) +
      candidate +
      current.slice(end);

    activeWordRef.current = {
      start,
      roman: source,
      converted: candidate,
    };

    requestIdRef.current++;

    if (transliterationTimeout.current) {
      clearTimeout(transliterationTimeout.current);
    }

    clearSuggestions();
    pendingCaret.current = start + candidate.length;

    updateContent(nextContent);
    textareaRef.current?.focus();
  }

  function handleContentKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (!suggestions.length || !suggestionRange) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((current) =>
        (current + 1) % suggestions.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion(
        (current) =>
          (current - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chooseSuggestion(
        suggestions[activeSuggestion] ?? suggestions[0],
      );
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clearSuggestions();
    }

    // Space, punctuation and Enter with no open suggestions are not
    // intercepted. The browser inserts them normally.
  }

  function toggleBengaliTyping() {
    const nextValue = !bengaliTyping;

    bengaliTypingRef.current = nextValue;
    setBengaliTyping(nextValue);

    if (transliterationTimeout.current) {
      clearTimeout(transliterationTimeout.current);
    }

    requestIdRef.current++;
    activeWordRef.current = null;
    clearSuggestions();
  }

  const updatePopupPosition = useCallback(() => {
    const textarea = textareaRef.current;
    const wrapper = editorBodyRef.current;

    if (!textarea || !wrapper || !suggestionRange) return;

    const caret = textarea.selectionStart;
    const textBeforeCaret = contentRef.current.slice(0, caret);

    const textareaRect = textarea.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const computed = window.getComputedStyle(textarea);

    const mirror = document.createElement("div");

    const properties = [
      "boxSizing",
      "width",
      "fontFamily",
      "fontSize",
      "fontWeight",
      "fontStyle",
      "letterSpacing",
      "lineHeight",
      "textAlign",
      "textIndent",
      "textTransform",
      "padding",
      "border",
      "whiteSpace",
      "overflowWrap",
      "wordBreak",
      "tabSize",
    ] as const;

    for (const property of properties) {
      mirror.style[property] = computed[property];
    }

    mirror.style.position = "fixed";
    mirror.style.left = `${textareaRect.left}px`;
    mirror.style.top = `${textareaRect.top}px`;
    mirror.style.height = "auto";
    mirror.style.minHeight = "0";
    mirror.style.maxHeight = "none";
    mirror.style.overflow = "hidden";
    mirror.style.visibility = "hidden";
    mirror.style.pointerEvents = "none";

    const textNode = document.createTextNode(textBeforeCaret);
    const marker = document.createElement("span");

    marker.textContent = "\u200b";

    mirror.appendChild(textNode);
    mirror.appendChild(marker);
    document.body.appendChild(mirror);

    const markerRect = marker.getBoundingClientRect();

    document.body.removeChild(mirror);

    const popupHeight = popupRef.current?.offsetHeight ?? 150;
    const popupWidth = popupRef.current?.offsetWidth ?? 280;
    const padding = 8;
    const gap = 4;

    let top = markerRect.bottom - wrapperRect.top + gap;

    if (top + popupHeight > wrapper.clientHeight - padding) {
      top = markerRect.top - wrapperRect.top - popupHeight - gap;
    }

    top = Math.max(
      padding,
      Math.min(
        top,
        Math.max(padding, wrapper.clientHeight - popupHeight - padding),
      ),
    );

    let left = markerRect.left - wrapperRect.left;

    left = Math.max(
      padding,
      Math.min(
        left,
        Math.max(padding, wrapper.clientWidth - popupWidth - padding),
      ),
    );

    setPopupPosition({ top, left });
  }, [suggestionRange]);

  useLayoutEffect(() => {
    if (!suggestions.length || !suggestionRange) return;

    updatePopupPosition();

    window.addEventListener("resize", updatePopupPosition);
    window.addEventListener("scroll", updatePopupPosition, true);

    return () => {
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition, true);
    };
  }, [
    suggestions,
    suggestionRange,
    content,
    activeSuggestion,
    updatePopupPosition,
  ]);

  useEffect(() => {
    const activeItem = popupRef.current?.querySelector<HTMLElement>(
      '[data-active="true"]',
    );

    activeItem?.scrollIntoView({ block: "nearest" });
  }, [activeSuggestion, suggestions]);

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

      <div className="mt-8 overflow-visible rounded-xl border border-[#383838] bg-[#1e1e1e]">
        <div ref={editorBodyRef} className="relative">
          {suggestions.length > 0 && suggestionRange && (
            <div
              ref={popupRef}
              className="absolute z-30 min-w-[250px] max-w-[320px] overflow-hidden rounded-md border border-[#454545] bg-[#252526] shadow-xl"
              style={{
                top: popupPosition.top,
                left: popupPosition.left,
              }}
            >
              <div className="flex items-center justify-between border-b border-[#383838] px-2.5 py-1.5 text-[10px] text-[#999999]">
                <span>Suggestions</span>
                <span>
                  {activeSuggestion + 1}/{suggestions.length}
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto py-1">
                {suggestions.map((candidate, index) => {
                  const isEnglish = candidate === suggestionRange.source;
                  const isActive = index === activeSuggestion;

                  return (
                    <button
                      key={`${candidate}-${index}`}
                      type="button"
                      data-active={isActive}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveSuggestion(index)}
                      onClick={() => chooseSuggestion(candidate)}
                      className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] ${
                        isActive
                          ? "bg-[#37373d] text-[#e4e4e4]"
                          : "text-[#cccccc] hover:bg-[#2a2d2e]"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center text-[11px] ${
                          isEnglish ? "text-[#b5b5b5]" : "text-[#75beff]"
                        }`}
                      >
                        {isEnglish ? "En" : "অ"}
                      </span>

                      <span className="min-w-0 flex-1 truncate">
                        {candidate}
                      </span>

                      <span className="shrink-0 text-[10px] text-[#858585]">
                        {isEnglish ? "English" : "Bengali"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-[#383838] px-2.5 py-1 text-[10px] text-[#858585]">
                ↑↓ Navigate · Enter Select · Esc Close
              </div>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(event) => handleContentChange(event.target.value)}
            onKeyDown={handleContentKeyDown}
            onClick={updatePopupPosition}
            onScroll={updatePopupPosition}
            placeholder="Start writing..."
            className="min-h-[650px] w-full resize-none bg-transparent p-6 text-base leading-8 text-[#d4d4d4] outline-none placeholder:text-[#6e7681]"
          />
        </div>
      </div>
    </>
  );
}