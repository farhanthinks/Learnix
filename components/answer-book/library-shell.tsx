"use client";

import { BookMarked, BookOpen, Clock, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import {
  LibraryFilterMenu,
  type LibraryFilters,
} from "@/components/answer-book/library-filter-menu";
import { MaterialRow, type MaterialRowData } from "@/components/answer-book/material-row";
import {
  SubjectMaterialCard,
  type SubjectLibraryData,
} from "@/components/answer-book/subject-material-card";
import { SummaryCard } from "@/components/study-plan/summary-card";

export interface LibrarySummary {
  totalNotes: number;
  subjectsCovered: number;
  recentlyGenerated: number;
  savedCount: number;
}

function matchesSearch(material: MaterialRowData, query: string): boolean {
  if (!query) return true;
  return (
    material.topicTitle.toLowerCase().includes(query) ||
    material.subjectName.toLowerCase().includes(query)
  );
}

function matchesFilters(material: MaterialRowData, filters: LibraryFilters): boolean {
  if (filters.size === 0) return true;
  return filters.has(material.difficulty);
}

function Section({
  title,
  icon: Icon,
  materials,
  emptyLabel,
}: {
  title: string;
  icon: typeof Clock;
  materials: MaterialRowData[];
  emptyLabel: string;
}) {
  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <div className="flex items-center gap-2">
        <Icon className="text-accent-primary h-4 w-4" strokeWidth={2} />
        <h2 className="text-text-primary text-sm font-semibold">{title}</h2>
      </div>
      {materials.length === 0 ? (
        <p className="text-text-secondary mt-3 text-sm">{emptyLabel}</p>
      ) : (
        <div className="divide-border mt-2 flex flex-col divide-y">
          {materials.map((m) => (
            <MaterialRow key={m.topicId} material={m} />
          ))}
        </div>
      )}
    </div>
  );
}

export function LibraryShell({
  summary,
  subjects,
  recentlyViewed,
  recentlyGenerated,
  savedMaterials,
}: {
  summary: LibrarySummary;
  subjects: SubjectLibraryData[];
  recentlyViewed: MaterialRowData[];
  recentlyGenerated: MaterialRowData[];
  savedMaterials: MaterialRowData[];
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<LibraryFilters>(new Set());

  const query = search.trim().toLowerCase();
  const hasActiveFilter = query.length > 0 || filters.size > 0;

  const filterList = useCallback(
    (materials: MaterialRowData[]) =>
      materials.filter((m) => matchesSearch(m, query) && matchesFilters(m, filters)),
    [query, filters],
  );

  const visibleSubjects = useMemo(() => {
    if (!hasActiveFilter) return subjects;
    return subjects
      .map((s) => ({ ...s, recentMaterials: filterList(s.recentMaterials) }))
      .filter((s) => s.recentMaterials.length > 0);
  }, [subjects, hasActiveFilter, filterList]);

  const visibleRecentlyViewed = useMemo(
    () => filterList(recentlyViewed),
    [recentlyViewed, filterList],
  );
  const visibleRecentlyGenerated = useMemo(
    () => filterList(recentlyGenerated),
    [recentlyGenerated, filterList],
  );
  const visibleSaved = useMemo(() => filterList(savedMaterials), [savedMaterials, filterList]);

  return (
    <div className="bg-bg mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-5 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-text-primary text-2xl font-semibold">AI Answer Book</h1>
          <p className="text-text-secondary text-sm">
            Your AI-generated study materials, organized in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, topics, or subjects..."
            className="border-border bg-surface text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:ring-accent-primary w-64 rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
          />
          <LibraryFilterMenu filters={filters} onChange={setFilters} />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={FileText}
          iconClassName="bg-accent-primary/10 text-accent-primary"
          label="Total Notes"
          value={String(summary.totalNotes)}
          hint="Generated so far"
        />
        <SummaryCard
          icon={BookOpen}
          iconClassName="bg-accent-success/10 text-accent-success"
          label="Subjects Covered"
          value={String(summary.subjectsCovered)}
          hint="With materials"
        />
        <SummaryCard
          icon={Sparkles}
          iconClassName="bg-accent-warning/10 text-accent-warning"
          label="Recently Generated"
          value={String(summary.recentlyGenerated)}
          hint="Last 7 days"
        />
        <SummaryCard
          icon={BookMarked}
          iconClassName="bg-accent-primary/10 text-accent-primary"
          label="Saved Materials"
          value={String(summary.savedCount)}
          hint="Bookmarked"
        />
      </div>

      {subjects.length === 0 ? (
        <div className="border-border bg-surface flex flex-col items-center gap-3 rounded-2xl border py-16 text-center">
          <FileText className="text-text-secondary h-8 w-8" strokeWidth={1.5} />
          <div>
            <p className="text-text-primary text-sm font-semibold">No study materials yet</p>
            <p className="text-text-secondary mt-1 text-sm">
              Open a topic from any subject and generate AI study notes to build your library.
            </p>
          </div>
          <Link
            href="/dashboard/subjects"
            className="bg-accent-primary mt-1 inline-flex w-auto items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white hover:brightness-110"
          >
            Browse Subjects
          </Link>
        </div>
      ) : (
        <>
          {visibleSubjects.length === 0 ? (
            <p className="text-text-secondary py-6 text-center text-sm">
              No materials match your search or filters.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {visibleSubjects.map((s) => (
                <SubjectMaterialCard key={s.slug} subject={s} />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Section
              title="Recently Viewed"
              icon={Clock}
              materials={visibleRecentlyViewed}
              emptyLabel="Nothing viewed yet."
            />
            <Section
              title="Recently Generated"
              icon={Sparkles}
              materials={visibleRecentlyGenerated}
              emptyLabel="Nothing generated yet."
            />
            <Section
              title="Saved Materials"
              icon={BookMarked}
              materials={visibleSaved}
              emptyLabel="Nothing saved yet — bookmark a topic's notes to see it here."
            />
          </div>
        </>
      )}
    </div>
  );
}
