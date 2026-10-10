"use client";

type ExportWorkButtonProps = {
  title: string;
  content: string;
};

export default function ExportWorkButton({
  title,
  content,
}: ExportWorkButtonProps) {
  function exportAsTxt() {
    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const safeTitle =
      (title.trim() || "Untitled")
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
        .replace(/[. ]+$/g, "") || "Untitled";

    link.href = url;
    link.download = `${safeTitle}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportAsTxt}
      className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
      title="Download work as a TXT file"
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
      Export TXT
    </button>
  );
}
