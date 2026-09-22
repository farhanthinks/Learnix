"use client";

import { Bookmark, Clock, Download, Layers, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AskAiPanel } from "@/components/answer-book/ask-ai-panel";
import { ExamplesTab } from "@/components/answer-book/examples-tab";
import { GenerateNotesPrompt } from "@/components/answer-book/generate-notes-prompt";
import { KeyPointsTab } from "@/components/answer-book/key-points-tab";
import { QaTab } from "@/components/answer-book/qa-tab";
import { StudyNotesTab } from "@/components/answer-book/study-notes-tab";
import { SummaryTab } from "@/components/answer-book/summary-tab";
import { TocSidebar } from "@/components/answer-book/toc-sidebar";
import { DifficultyBadge } from "@/components/subjects/difficulty-badge";
import { extractHeadings } from "@/lib/answer-book/headings";
import { formatDurationLabel } from "@/lib/calendar/session";
import { formatRelativeTime } from "@/lib/format";
import { estimateTopicMinutes } from "@/lib/topics/estimate";
import type { TopicDifficulty } from "@/types/database";

export interface TopicNotesData {
  content: string;
  summary: string;
  keyPoints: string[];
  examples: string;
  qa: { question: string; answer: string }[];
  generatedAt: string | null;
  isSaved: boolean;
}

type TabKey = "notes" | "summary" | "keypoints" | "examples" | "qa";

const TABS: { key: TabKey; label: string }[] = [
  { key: "notes", label: "Study Notes" },
  { key: "summary", label: "Summary" },
  { key: "keypoints", label: "Key Points" },
  { key: "qa", label: "Important Q&A" },
  { key: "examples", label: "Examples" },
];

export function AnswerBookShell({
  subjectSlug,
  subjectName,
  topic,
  initialNotes,
}: {
  subjectSlug: string;
  subjectName: string;
  topic: {
    id: string;
    title: string;
    unitTitle: string | null;
    subtopics: string[] | null;
    difficulty: TopicDifficulty;
  };
  initialNotes: TopicNotesData | null;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [activeTab, setActiveTab] = useState<TabKey>("notes");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [isSavingBookmark, setIsSavingBookmark] = useState(false);
  const [askAiOpen, setAskAiOpen] = useState(false);
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  const headings = useMemo(() => (notes ? extractHeadings(notes.content) : []), [notes]);

  useEffect(() => {
    if (activeTab !== "notes" || !pendingScrollId) return;
    const id = pendingScrollId;
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      setPendingScrollId(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [activeTab, pendingScrollId]);

  function handleTocNavigate(id: string) {
    if (activeTab !== "notes") {
      setActiveTab("notes");
      setPendingScrollId(id);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function handleRegenerate() {
    if (notes) {
      const confirmed = window.confirm(
        "Regenerate the AI notes for this topic? This will replace the current content.",
      );
      if (!confirmed) return;
    }
    setRegenerateError(null);
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/topics/${topic.id}/notes`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setRegenerateError(json.error ?? "Could not regenerate notes.");
        return;
      }
      setNotes({
        content: json.notes.content,
        summary: json.notes.summary,
        keyPoints: json.notes.key_points ?? [],
        examples: json.notes.examples,
        qa: json.notes.qa ?? [],
        generatedAt: json.notes.generated_at,
        isSaved: json.notes.is_saved ?? false,
      });
    } catch {
      setRegenerateError("Network error. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  }

  async function toggleBookmark() {
    if (!notes) return;
    const nextSaved = !notes.isSaved;
    setNotes({ ...notes, isSaved: nextSaved });
    setIsSavingBookmark(true);
    try {
      const res = await fetch(`/api/topics/${topic.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSaved: nextSaved }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setNotes({ ...notes, isSaved: !nextSaved });
    } finally {
      setIsSavingBookmark(false);
    }
  }

  const estimatedMinutes = estimateTopicMinutes({
    difficulty: topic.difficulty,
    subtopics: topic.subtopics,
  });

  return (
    <div className="bg-bg mx-auto flex w-full max-w-[1300px] flex-1 flex-col gap-5 px-6 py-8">
      <nav className="text-text-secondary flex flex-wrap items-center gap-1.5 text-sm">
        <Link href="/dashboard/answer-book" className="hover:text-text-primary">
          AI Answer Book
        </Link>
        <span>›</span>
        <Link href={`/dashboard/answer-book/${subjectSlug}`} className="hover:text-text-primary">
          {subjectName}
        </Link>
        <span>›</span>
        <span className="text-text-primary font-medium">{topic.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <DifficultyBadge difficulty={topic.difficulty} />
          <h1 className="font-display text-text-primary mt-2 text-2xl font-semibold">
            {topic.title}
          </h1>
          {topic.unitTitle && <p className="text-text-secondary mt-1 text-sm">{topic.unitTitle}</p>}
          <div className="text-text-secondary mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
              {formatDurationLabel(estimatedMinutes)} read
            </span>
            {topic.subtopics && topic.subtopics.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" strokeWidth={1.75} />
                {topic.subtopics.length} Subtopics
              </span>
            )}
            {notes?.generatedAt && (
              <span>Last updated {formatRelativeTime(notes.generatedAt)}</span>
            )}
          </div>
        </div>

        <div className="no-print flex shrink-0 items-center gap-2">
          {notes && (
            <button
              type="button"
              onClick={toggleBookmark}
              disabled={isSavingBookmark}
              aria-label={notes.isSaved ? "Remove from saved materials" : "Save this material"}
              aria-pressed={notes.isSaved}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-60 ${
                notes.isSaved
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border text-text-secondary hover:bg-surface-raised"
              }`}
            >
              <Bookmark
                className="h-4 w-4"
                strokeWidth={2}
                fill={notes.isSaved ? "currentColor" : "none"}
              />
            </button>
          )}
          <button
            type="button"
            onClick={() => setAskAiOpen(true)}
            className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            Ask AI
          </button>
          {notes && (
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="bg-accent-primary inline-flex w-auto items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`}
                strokeWidth={2}
              />
              {isRegenerating ? "Generating..." : "Regenerate"}
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="border-border text-text-primary hover:bg-surface-raised flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
            aria-label="Download notes"
            title="Download notes"
          >
            <Download className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {regenerateError && <p className="text-accent-danger text-sm">{regenerateError}</p>}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_260px]">
        <div className="min-w-0">
          <div className="border-border no-print overflow-x-auto border-b">
            <div className="flex w-max gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? "border-accent-primary text-accent-primary"
                      : "text-text-secondary hover:text-text-primary border-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div
            id="answer-book-content"
            className="border-border bg-surface mt-4 rounded-2xl border p-6"
          >
            {activeTab === "notes" &&
              (notes ? (
                <StudyNotesTab markdown={notes.content} />
              ) : (
                <GenerateNotesPrompt topicId={topic.id} onGenerated={setNotes} />
              ))}
            {activeTab === "summary" &&
              (notes ? (
                <SummaryTab markdown={notes.summary} />
              ) : (
                <EmptyTabPlaceholder onGoToNotes={() => setActiveTab("notes")} />
              ))}
            {activeTab === "keypoints" &&
              (notes ? (
                <KeyPointsTab points={notes.keyPoints} />
              ) : (
                <EmptyTabPlaceholder onGoToNotes={() => setActiveTab("notes")} />
              ))}
            {activeTab === "qa" &&
              (notes ? (
                <QaTab items={notes.qa} />
              ) : (
                <EmptyTabPlaceholder onGoToNotes={() => setActiveTab("notes")} />
              ))}
            {activeTab === "examples" &&
              (notes ? (
                <ExamplesTab markdown={notes.examples} />
              ) : (
                <EmptyTabPlaceholder onGoToNotes={() => setActiveTab("notes")} />
              ))}
          </div>
        </div>

        <aside className="no-print">
          <TocSidebar
            headings={headings}
            isNotesTabActive={activeTab === "notes"}
            onNavigate={handleTocNavigate}
          />
        </aside>
      </div>

      {askAiOpen && (
        <AskAiPanel
          topicId={topic.id}
          topicTitle={topic.title}
          onClose={() => setAskAiOpen(false)}
        />
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          nav, aside { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function EmptyTabPlaceholder({ onGoToNotes }: { onGoToNotes: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <p className="text-text-secondary text-sm">Generate Study Notes first to see this.</p>
      <button
        type="button"
        onClick={onGoToNotes}
        className="text-accent-primary text-sm font-medium hover:underline"
      >
        Go to Study Notes →
      </button>
    </div>
  );
}
