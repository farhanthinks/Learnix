import { Bookmark, FileText } from "lucide-react";
import Link from "next/link";

import { DifficultyBadge } from "@/components/subjects/difficulty-badge";
import { formatRelativeTime } from "@/lib/format";
import type { TopicDifficulty } from "@/types/database";

export interface TopicMaterialRowData {
  topicId: string;
  topicSlug: string;
  topicTitle: string;
  difficulty: TopicDifficulty;
  isSaved: boolean;
  generated: boolean;
  hasNotes: boolean;
  hasSummary: boolean;
  hasKeyPoints: boolean;
  hasQa: boolean;
  hasExamples: boolean;
  generatedAt: string | null;
}

type MaterialFlagKey = "hasNotes" | "hasSummary" | "hasKeyPoints" | "hasQa" | "hasExamples";

const MATERIAL_TYPES: { key: MaterialFlagKey; label: string }[] = [
  { key: "hasNotes", label: "Study Notes" },
  { key: "hasSummary", label: "Summary" },
  { key: "hasKeyPoints", label: "Key Points" },
  { key: "hasQa", label: "Important Q&A" },
  { key: "hasExamples", label: "Examples" },
];

export function TopicMaterialRow({
  subjectSlug,
  topic,
}: {
  subjectSlug: string;
  topic: TopicMaterialRowData;
}) {
  const href = `/dashboard/answer-book/${subjectSlug}/${topic.topicSlug}`;

  return (
    <div className="hover:bg-surface-raised flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors">
      <span className="bg-accent-primary/10 text-accent-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
        <FileText className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link
            href={href}
            className="text-text-primary hover:text-accent-primary truncate text-sm font-medium"
          >
            {topic.topicTitle}
          </Link>
          {topic.isSaved && (
            <Bookmark
              className="text-accent-primary h-3 w-3 shrink-0"
              strokeWidth={2}
              fill="currentColor"
            />
          )}
        </div>
        <p className="text-text-secondary truncate text-xs">
          {topic.generated && topic.generatedAt
            ? `Updated ${formatRelativeTime(topic.generatedAt)}`
            : "Not generated yet"}
        </p>
      </div>

      <div className="hidden shrink-0 items-center gap-1 sm:flex">
        {MATERIAL_TYPES.map((m) => (
          <span
            key={m.key}
            title={`${m.label}${topic[m.key] ? " generated" : " not generated"}`}
            className={`h-1.5 w-1.5 rounded-full ${topic[m.key] ? "bg-accent-primary" : "bg-border"}`}
          />
        ))}
      </div>

      <DifficultyBadge difficulty={topic.difficulty} />

      <Link
        href={href}
        className={`inline-flex w-auto shrink-0 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
          topic.generated
            ? "border-border text-text-primary hover:bg-surface-raised border"
            : "bg-accent-primary text-white hover:brightness-110"
        }`}
      >
        {topic.generated ? "Open" : "Generate"}
      </Link>
    </div>
  );
}
