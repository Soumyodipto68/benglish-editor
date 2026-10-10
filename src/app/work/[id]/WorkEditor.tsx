"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import WorkEditorHeader from "./components/WorkEditorHeader";
import SuggestionPopup from "./components/SuggestionPopup";

type WorkEditorProps = {
  workId: string;
  initialTitle: string;
  initialContent: string;
};

type SuggestionRange = {
  start: number;
  end: number;
  source: string;
  displayed: string;
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

const DELIMITERS = /[ \n,.;?!:]/;

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
  const [activeSuggestion, setActiveSuggestion] = useState(0);

  const [popupPosition, setPopupPosition] = useState<PopupPosition>({
    top: 40,
    left: 24,
  });

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transliterationTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorBodyRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const pendingCaret = useRef<number | null>(null);
  const contentRef = useRef(initialContent);
  const titleRef = useRef(initialTitle);

  const activeWordRef = useRef<ActiveWord | null>(null);
  const requestIdRef = useRef(0);
  const bengaliTypingRef = useRef(true);

  // Tracks words converted during the current editing session.
  const convertedWordsRef = useRef<ActiveWord[]>([]);

  // Cache results and deduplicate simultaneous requests.
  const candidateCache = useRef(new Map<string, string[]>());
  const candidateRequests = useRef(new Map<string, Promise<string[]>>());

  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      if (transliterationTimeout.current) {
        clearTimeout(transliterationTimeout.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (pendingCaret.current === null || !textareaRef.current) {
      return;
    }

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
    if (cached) {
      return cached;
    }

    const pending = candidateRequests.current.get(cacheKey);
    if (pending) {
      return pending;
    }

    const request = (async () => {
      const response = await fetch("/api/transliterate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word,
          language: "bn",
        }),
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

      // Keep the original Roman spelling available as an option.
      if (!values.includes(word)) {
        values.push(word);
      }

      candidateCache.current.set(cacheKey, values);
      return values;
    })();

    candidateRequests.current.set(cacheKey, request);

    try {
      return await request;
    } finally {
      candidateRequests.current.delete(cacheKey);
    }
  }

  function recordConvertedWord(
    start: number,
    roman: string,
    converted: string,
  ) {
    const end = start + converted.length;

    convertedWordsRef.current = [
      ...convertedWordsRef.current.filter(
        (word) =>
          word.start + word.converted.length <= start || word.start >= end,
      ),
      {
        start,
        roman,
        converted,
      },
    ].sort((a, b) => a.start - b.start);
  }

  // Keeps tracked word positions aligned with document edits.
  // Words touched by an edit are removed from tracking.
  function updateConvertedWordPositions(previous: string, next: string) {
    let start = 0;

    while (
      start < previous.length &&
      start < next.length &&
      previous[start] === next[start]
    ) {
      start++;
    }

    let oldEnd = previous.length;
    let newEnd = next.length;

    while (
      oldEnd > start &&
      newEnd > start &&
      previous[oldEnd - 1] === next[newEnd - 1]
    ) {
      oldEnd--;
      newEnd--;
    }

    const delta = newEnd - oldEnd;

    convertedWordsRef.current = convertedWordsRef.current.flatMap((word) => {
      const wordEnd = word.start + word.converted.length;

      if (wordEnd <= start) {
        return [word];
      }

      if (word.start >= oldEnd) {
        return [
          {
            ...word,
            start: word.start + delta,
          },
        ];
      }

      return [];
    });
  }

  // Show suggestions after a consistent 250 ms pause.
  // Ignore outdated requests without blocking the editor.
  function scheduleAutomaticTransliteration(value: string) {
    if (transliterationTimeout.current) {
      clearTimeout(transliterationTimeout.current);
      transliterationTimeout.current = null;
    }

    if (!bengaliTypingRef.current) {
      return;
    }

    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const cursor = textarea.selectionStart;

    // Suggestions apply to the Roman word immediately before the caret,
    // not necessarily the word at the end of the document.
    const beforeCaret = value.slice(0, cursor);
    const match = beforeCaret.match(/[A-Za-z]+$/);

    if (!match || match[0].length < 2) {
      return;
    }

    const word = match[0];
    const start = cursor - word.length;
    const requestId = ++requestIdRef.current;

    transliterationTimeout.current = setTimeout(async () => {
      const currentTextarea = textareaRef.current;

      if (
        !currentTextarea ||
        !bengaliTypingRef.current ||
        requestId !== requestIdRef.current ||
        contentRef.current !== value ||
        currentTextarea.selectionStart !== cursor ||
        currentTextarea.selectionEnd !== cursor
      ) {
        return;
      }

      try {
        const candidates = await getCandidates(word);

        const latestTextarea = textareaRef.current;
        const current = contentRef.current;

        // Discard results if the user has typed, moved the caret,
        // changed modes, or started a newer suggestion request.
        if (
          requestId !== requestIdRef.current ||
          !bengaliTypingRef.current ||
          !latestTextarea ||
          current !== value ||
          latestTextarea.selectionStart !== cursor ||
          latestTextarea.selectionEnd !== cursor ||
          current.slice(start, start + word.length) !== word
        ) {
          return;
        }

        const options = [...new Set([...candidates, word])];

        setSuggestions(options);
        setActiveSuggestion(0);

        setSuggestionRange({
          start,
          end: start + word.length,
          source: word,
          displayed: word,
        });
      } catch (error) {
        console.error("Transliteration suggestions failed:", error);
      }
    }, 250);
  }

  // Converts a completed Roman word after a delimiter is typed.
  async function convertWordBeforeDelimiter(value: string, cursor: number) {
    if (!bengaliTypingRef.current || cursor < 2) {
      return;
    }

    const delimiter = value[cursor - 1];

    if (!DELIMITERS.test(delimiter)) {
      return;
    }

    const beforeDelimiter = value.slice(0, cursor - 1);
    const match = beforeDelimiter.match(/[A-Za-z]+$/);

    if (!match) {
      return;
    }

    const word = match[0];
    const start = cursor - 1 - word.length;

    if (start < 0) {
      return;
    }

    try {
      const candidates = await getCandidates(word);

      if (!bengaliTypingRef.current) {
        return;
      }

      const current = contentRef.current;

      if (
        current.slice(start, start + word.length) !== word ||
        current[start + word.length] !== delimiter
      ) {
        return;
      }

      const converted = candidates[0] ?? word;

      if (converted === word) {
        return;
      }

      const nextContent =
        current.slice(0, start) +
        converted +
        current.slice(start + word.length);

      const textarea = textareaRef.current;
      const caret = textarea?.selectionStart ?? cursor;

      updateConvertedWordPositions(current, nextContent);
      recordConvertedWord(start, word, converted);

      activeWordRef.current = {
        start,
        roman: word,
        converted,
      };

      pendingCaret.current =
        caret >= start + word.length
          ? caret + converted.length - word.length
          : caret;

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

    // Restore the Roman spelling if the user continues typing
    // a word after it has already been converted.
    if (activeWord) {
      const prefix = previous.slice(0, activeWord.start);
      const convertedPrefix = prefix + activeWord.converted;

      if (value.startsWith(convertedPrefix)) {
        const appendedText = value.slice(convertedPrefix.length);

        if (/^[A-Za-z]+$/.test(appendedText)) {
          const restored = prefix + activeWord.roman + appendedText;

          activeWordRef.current = null;
          requestIdRef.current++;
          clearSuggestions();

          pendingCaret.current =
            prefix.length + activeWord.roman.length + appendedText.length;

          updateConvertedWordPositions(previous, restored);
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

    updateConvertedWordPositions(previous, value);
    updateContent(value);

    // The browser inserts the delimiter immediately. Conversion runs
    // asynchronously so normal typing is not blocked.
    if (
      cursor > 0 &&
      DELIMITERS.test(value[cursor - 1]) &&
      value.length >= previous.length
    ) {
      void convertWordBeforeDelimiter(value, cursor);
    }

    scheduleAutomaticTransliteration(value);
  }

  function chooseSuggestion(candidate: string) {
    if (!suggestionRange) {
      return;
    }

    const { start, end, source, displayed } = suggestionRange;
    const current = contentRef.current;

    // Only replace the exact word this popup belongs to.
    if (current.slice(start, end) !== displayed) {
      clearSuggestions();
      return;
    }

    const nextContent =
      current.slice(0, start) + candidate + current.slice(end);

    updateConvertedWordPositions(current, nextContent);

    if (candidate !== source) {
      recordConvertedWord(start, source, candidate);
    }

    activeWordRef.current =
      candidate !== source && start + displayed.length === current.length
        ? {
            start,
            roman: source,
            converted: candidate,
          }
        : null;

    requestIdRef.current++;

    if (transliterationTimeout.current) {
      clearTimeout(transliterationTimeout.current);
    }

    clearSuggestions();

    pendingCaret.current = start + candidate.length;
    updateContent(nextContent);
    textareaRef.current?.focus();
  }

  // Click a converted word to reopen its alternatives.
  async function handleEditorClick() {
    if (!bengaliTypingRef.current) {
      return;
    }

    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const caret = textarea.selectionStart;

    const word = convertedWordsRef.current.find(
      (item) =>
        caret >= item.start && caret <= item.start + item.converted.length,
    );

    if (!word) {
      clearSuggestions();
      return;
    }

    const expectedText = word.converted;

    try {
      const candidates = await getCandidates(word.roman);
      const current = contentRef.current;

      // The text may have changed while candidates were loading.
      if (
        current.slice(word.start, word.start + expectedText.length) !==
        expectedText
      ) {
        return;
      }

      const options = [...new Set([...candidates, word.roman])];

      setSuggestions(options);

      setSuggestionRange({
        start: word.start,
        end: word.start + expectedText.length,
        source: word.roman,
        displayed: expectedText,
      });

      const currentIndex = options.indexOf(expectedText);

      setActiveSuggestion(currentIndex >= 0 ? currentIndex : 0);
    } catch (error) {
      console.error("Could not load word suggestions:", error);
    }
  }

  function handleContentKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Space commits the selected suggestion and inserts a space.
    if (event.key === " " && suggestions.length > 0 && suggestionRange) {
      const textarea = textareaRef.current;
      const { start, end, displayed, source } = suggestionRange;
      const current = contentRef.current;

      if (
        textarea &&
        textarea.selectionStart === end &&
        textarea.selectionEnd === end &&
        current.slice(start, end) === displayed
      ) {
        event.preventDefault();

        const candidate = suggestions[activeSuggestion] ?? suggestions[0];

        const nextContent =
          current.slice(0, start) + candidate + " " + current.slice(end);

        requestIdRef.current++;

        if (transliterationTimeout.current) {
          clearTimeout(transliterationTimeout.current);
        }

        updateConvertedWordPositions(current, nextContent);

        if (candidate !== source) {
          recordConvertedWord(start, source, candidate);
        }

        activeWordRef.current = null;
        pendingCaret.current = start + candidate.length + 1;

        clearSuggestions();
        updateContent(nextContent);

        return;
      }
    }

    if (!suggestions.length || !suggestionRange) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveSuggestion((current) => (current + 1) % suggestions.length);

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveSuggestion(
        (current) => (current - 1 + suggestions.length) % suggestions.length,
      );

      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      chooseSuggestion(suggestions[activeSuggestion] ?? suggestions[0]);

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clearSuggestions();
    }
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

    if (!textarea || !wrapper || !suggestionRange) {
      return;
    }

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
    if (!suggestions.length || !suggestionRange) {
      return;
    }

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
      <WorkEditorHeader
        title={title}
        content={content}
        onTitleChange={handleTitleChange}
        bengaliTyping={bengaliTyping}
        onToggleBengaliTyping={toggleBengaliTyping}
        saveStatus={saveStatus}
      />
      <div className="mt-8 overflow-visible rounded-xl border border-[#383838] bg-[#1e1e1e]">
        <div ref={editorBodyRef} className="relative">
          <SuggestionPopup
            suggestions={suggestions}
            suggestionRange={suggestionRange}
            activeSuggestion={activeSuggestion}
            popupPosition={popupPosition}
            popupRef={popupRef}
            onActiveSuggestionChange={setActiveSuggestion}
            onChooseSuggestion={chooseSuggestion}
          />

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(event) => handleContentChange(event.target.value)}
            onKeyDown={handleContentKeyDown}
            onClick={() => void handleEditorClick()}
            onScroll={updatePopupPosition}
            placeholder="Start writing..."
            className="min-h-[650px] w-full resize-none bg-transparent p-6 text-base leading-8 text-[#d4d4d4] outline-none placeholder:text-[#6e7681]"
          />
        </div>
      </div>
    </>
  );
}
