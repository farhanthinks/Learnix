import { BookOpen } from "lucide-react";
import Link from "next/link";

import { MaterialRow, type MaterialRowData } from "@/components/answer-book/material-row";

export interface SubjectLibraryData {
  slug: string;
  name: string;
  topicsTotal: number;
  materialsGenerated: number;
  categoryCounts: { studyNotes: number; summaries: number; keyPoints: number; qa: number };
  recentMaterials: MaterialRowData[];
}

function CategoryChip({ label, count }: { label: string; count: number }) {
  return (
    <span className="bg-surface-raised text-text-secondary rounded-full px-2.5 py-1 text-xs font-medium">
      {label} <span className="text-text-primary font-mono">{count}</span>
    </span>
  );
}

export function SubjectMaterialCard({ subject }: { subject: SubjectLibraryData }) {
  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <div className="flex items-center gap-3">
        <span className="bg-accent-primary/10 text-accent-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <BookOpen className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <Link
            href={`/dashboard/subjects/${subject.slug}`}
            className="text-text-primary hover:text-accent-primary text-sm font-semibold"
          >
            {subject.name}
          </Link>
          <p className="text-text-secondary text-xs">
            {subject.topicsTotal} topics · {subject.materialsGenerated} generated materials
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <CategoryChip label="Study Notes" count={subject.categoryCounts.studyNotes} />
        <CategoryChip label="Summaries" count={subject.categoryCounts.summaries} />
        <CategoryChip label="Key Points" count={subject.categoryCounts.keyPoints} />
        <CategoryChip label="Important Q&A" count={subject.categoryCounts.qa} />
      </div>

      {subject.recentMaterials.length > 0 && (
        <div className="border-border divide-border mt-4 flex flex-col divide-y border-t pt-2">
          {subject.recentMaterials.map((m) => (
            <MaterialRow key={m.topicId} material={m} showSubject={false} />
          ))}
        </div>
      )}
    </div>
  );
}
