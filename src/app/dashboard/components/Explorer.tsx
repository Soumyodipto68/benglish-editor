"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import NewFolderButton from "./NewFolderButton";
import NewWorkButton from "./NewWorkButton";

type Work = {
  id: string;
  title: string;
};

type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  isSystem: boolean;
  children: Folder[];
  works: Work[];
};

type ExplorerProps = {
  folders: Folder[];
  selectedFolderId?: string;
  selectedWorkId?: string;
};

function FolderItem({
  folder,
  level,
  selectedFolderId,
  selectedWorkId,
  allowNewFolder = false,
}: {
  folder: Folder;
  level: number;
  selectedFolderId?: string;
  selectedWorkId?: string;
  allowNewFolder?: boolean;
}) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  const hasChildren = folder.children.length > 0 || folder.works.length > 0;

  const isSelected = selectedFolderId === folder.id;

  function handleFolderClick() {
    if (hasChildren) {
      setIsOpen((value) => !value);
    }
  }

  function handleFolderDoubleClick() {
    router.push(`/dashboard?folder=${encodeURIComponent(folder.id)}`);
  }

  return (
    <div>
      {/* Folder */}
      <div
        className={`group flex items-center ${
          isSelected ? "bg-zinc-800" : "hover:bg-zinc-900"
        }`}
        style={{
          paddingLeft: `${12 + level * 16}px`,
        }}
        onDoubleClick={handleFolderDoubleClick}
      >
        {/* Expand / collapse */}
        <button
          type="button"
          onClick={handleFolderClick}
          className="flex h-7 w-5 shrink-0 items-center justify-center text-xs text-zinc-500"
          aria-label={isOpen ? "Collapse folder" : "Expand folder"}
        >
          {hasChildren ? (isOpen ? "▾" : "▸") : ""}
        </button>

        {/* Folder name */}
        <button
          type="button"
          onClick={handleFolderClick}
          onDoubleClick={handleFolderDoubleClick}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-sm text-zinc-300"
        >
          <span className="text-sm">{isOpen && hasChildren ? "📂" : "📁"}</span>

          <span className="truncate">{folder.name}</span>
        </button>

        {/* Actions */}
        <div className="flex items-center pr-2">
          {folder.name !== "Others" && (
            <NewWorkButton
              folders={[{ id: folder.id, name: folder.name }]}
              defaultFolderId={folder.id}
              compact
            />
          )}

          {/* Only Others and its descendants can create folders */}
          {allowNewFolder && <NewFolderButton parentId={folder.id} />}
        </div>
      </div>

      {/* Contents */}
      {isOpen && (
        <div>
          {/* Child folders */}
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              selectedWorkId={selectedWorkId}
              allowNewFolder
            />
          ))}

          {/* Works */}
          {folder.works.map((work) => {
            const isWorkSelected = selectedWorkId === work.id;

            return (
              <Link
                key={work.id}
                href={`/work/${work.id}`}
                className={`flex items-center gap-2 py-1.5 pr-3 text-sm ${
                  isWorkSelected
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                }`}
                style={{
                  paddingLeft: `${44 + level * 16}px`,
                }}
              >
                <span className="text-xs">📄</span>

                <span className="truncate">{work.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Explorer({
  folders,
  selectedFolderId,
  selectedWorkId,
}: ExplorerProps) {
  const rootFolders = folders.filter((folder) => folder.parentId === null);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Explorer header */}
      <div className="flex h-10 items-center justify-between border-b border-zinc-800 px-4">
        <span className="text-xs font-semibold tracking-wide text-zinc-400">
          EXPLORER
        </span>

        <button
          type="button"
          className="text-sm text-zinc-500 transition hover:text-white"
          title="More actions"
        >
          ⋯
        </button>
      </div>

      {/* All Works */}
      <div className="border-b border-zinc-900 py-2">
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 px-4 py-1.5 text-sm ${
            !selectedFolderId && !selectedWorkId
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          <span>⌂</span>
          <span>All Works</span>
        </Link>
      </div>

      {/* Folder tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {rootFolders.length === 0 ? (
          <p className="px-5 py-3 text-xs text-zinc-600">No folders found.</p>
        ) : (
          rootFolders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              level={0}
              selectedFolderId={selectedFolderId}
              selectedWorkId={selectedWorkId}
              allowNewFolder={folder.name === "Others"}
            />
          ))
        )}
      </div>
    </div>
  );
}
