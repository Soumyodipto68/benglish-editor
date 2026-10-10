
"use client";

import type { RefObject } from "react";

type SuggestionRange = {
  start: number;
  end: number;
  source: string;
  displayed: string;
};

type PopupPosition = {
  top: number;
  left: number;
};

type SuggestionPopupProps = {
  suggestions: string[];
  suggestionRange: SuggestionRange | null;
  activeSuggestion: number;
  popupPosition: PopupPosition;
  popupRef: RefObject<HTMLDivElement | null>;
  onActiveSuggestionChange: (index: number) => void;
  onChooseSuggestion: (candidate: string) => void;
};

export default function SuggestionPopup({
  suggestions,
  suggestionRange,
  activeSuggestion,
  popupPosition,
  popupRef,
  onActiveSuggestionChange,
  onChooseSuggestion,
}: SuggestionPopupProps) {
  if (suggestions.length === 0 || !suggestionRange) {
    return null;
  }

  return (
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
              onMouseEnter={() => onActiveSuggestionChange(index)}
              onClick={() => onChooseSuggestion(candidate)}
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
  );
}
