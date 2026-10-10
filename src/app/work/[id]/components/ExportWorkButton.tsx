"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";

type ExportWorkButtonProps = {
  title: string;
  content: string;
};

function getSafeTitle(title: string) {
  return (
    (title.trim() || "Untitled")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
      .replace(/[. ]+$/g, "") || "Untitled"
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ExportWorkButton({
  title,
  content,
}: ExportWorkButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function exportAsTxt() {
    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    downloadBlob(blob, `${getSafeTitle(title)}.txt`);
    setIsOpen(false);
  }

  async function exportAsDocx() {
    const paragraphs = content.split(/\r\n|\n|\r/);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs.map(
            (paragraph) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: paragraph,
                    font: "Nirmala UI",
                  }),
                ],
                spacing: {
                  after: 120,
                },
              }),
          ),
        },
      ],
    });

    try {
      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, `${getSafeTitle(title)}.docx`);
    } catch (error) {
      console.error("DOCX export failed:", error);
    }

    setIsOpen(false);
  }

  function exportAsPdf() {
    setIsOpen(false);

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow pop-ups to export your PDF.");
      return;
    }

    const safeTitle = getSafeTitle(title);

    const escapedTitle = safeTitle
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    const escapedContent = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="bn">
      <head>
        <meta charset="UTF-8" />
        <title>${escapedTitle}</title>
        <style>
          @page {
            size: A4;
            margin: 22mm 20mm;
          }

          body {
            font-family:
              "Nirmala UI",
              "Noto Sans Bengali",
              sans-serif;
            font-size: 12pt;
            line-height: 1.9;
            color: #111;
            overflow-wrap: anywhere;
          }

          h1 {
            font-size: 18pt;
            margin-bottom: 24px;
            overflow-wrap: anywhere;
          }

          .content {
            white-space: pre-wrap;
            overflow-wrap: anywhere;
          }

          @media screen {
            body {
              max-width: 800px;
              margin: 40px auto;
              padding: 30px;
            }
          }
        </style>
      </head>
      <body>
        <h1>${escapedTitle}</h1>
        <div class="content">${escapedContent}</div>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

    printWindow.document.close();
  }

  const menuItemClass =
    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-zinc-200 transition hover:bg-zinc-800";

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3"
          />
        </svg>
        Export
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-3.5 w-3.5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-zinc-700 bg-[#252526] py-1 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={exportAsTxt}
            className={menuItemClass}
          >
            <span className="w-5 text-center text-xs font-bold text-zinc-400">
              TXT
            </span>
            Export TXT
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={exportAsDocx}
            className={menuItemClass}
          >
            <span className="w-5 text-center text-xs font-bold text-blue-400">
              W
            </span>
            Export DOCX
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={exportAsPdf}
            className={menuItemClass}
          >
            <span className="w-5 text-center text-xs font-bold text-red-400">
              PDF
            </span>
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
