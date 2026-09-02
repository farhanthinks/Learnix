"use client";

import { Bookmark, FileText, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { DifficultyBadge } from "@/components/subjects/difficulty-badge";
import { formatRelativeTime } from "@/lib/format";
import type { TopicDifficulty } from "@/types/database";

export interface MaterialRowData {
  topicId: string;
  topicTitle: string;
  subjectName: string;
  subjectSlug: string;
  topicSlug: string;
  difficulty: TopicDifficulty;
  generatedAt: string;
  isSaved: boolean;
}

export function MaterialRow({
  material,
  showSubject = true,
  onRemoved,
}: {
  material: MaterialRowData;
  showSubject?: boolean;
  onRemoved?: (topicId: string) => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(material.isSaved);
  const [isBusy, setIsBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const href = `/dashboard/answer-book/${material.subjectSlug}/${material.topicSlug}`;

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  async function toggleSave() {
    setMenuOpen(false);
    const next = !isSaved;
    setIsSaved(next);
    setIsBusy(true);
    try {
      const res = await fetch(`/api/topics/${material.topicId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSaved: next }),
      });
      if (!res.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setIsSaved(!next);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    const confirmed = window.confirm(`Delete the generated notes for "${material.topicTitle}"?`);
    if (!confirmed) return;
    setIsBusy(true);
    try {
      const res = await fetch(`/api/topics/${material.topicId}/notes`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      onRemoved?.(material.topicId);
      router.refresh();
    } catch {
      setIsBusy(false);
    }
  }

  return (
    <div className="hover:bg-surface-raised group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors">
      <span className="bg-accent-primary/10 text-accent-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
        <FileText className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={href}
          className="text-text-primary hover:text-accent-primary truncate text-sm font-medium"
        >
          {material.topicTitle}
        </Link>
        <p className="text-text-secondary truncate text-xs">
          {showSubject ? `${material.subjectName} · ` : ""}Study Notes ·{" "}
          {formatRelativeTime(material.generatedAt)}
        </p>
      </div>
      <DifficultyBadge difficulty={material.difficulty} />
      {isSaved && (
        <Bookmark
          className="text-accent-primary h-3.5 w-3.5 shrink-0"
          strokeWidth={2}
          fill="currentColor"
        />
      )}
      <Link
        href={href}
        className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto shrink-0 items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
      >
        Read
      </Link>
      <div ref={menuRef} className="relative shrink-0">
        <button
          type="button"
          aria-label="Material actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          disabled={isBusy}
          onClick={() => setMenuOpen((v) => !v)}
          className="text-text-secondary hover:bg-surface-raised hover:text-text-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
        >
          <MoreVertical className="h-4 w-4" strokeWidth={2} />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="border-border bg-surface absolute top-9 right-0 z-20 w-44 overflow-hidden rounded-lg border py-1 shadow-lg"
          >
            <Link
              href={href}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="text-text-secondary hover:bg-surface-raised hover:text-text-primary block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
            >
              Open
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={toggleSave}
              className="text-text-secondary hover:bg-surface-raised hover:text-text-primary block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
            >
              {isSaved ? "Remove from Saved" : "Save"}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleDelete}
              className="text-accent-danger hover:bg-accent-danger/10 block w-full px-3 py-1.5 text-left text-xs font-medium transition-colors"
            >
              Delete Notes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
