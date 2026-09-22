"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  LibraryFilterMenu,
  type LibraryFilters,
} from "@/components/answer-book/library-filter-menu";
import {
  TopicMaterialRow,
  type TopicMaterialRowData,
} from "@/components/answer-book/topic-material-row";

export interface UnitTopicGroup {
  unitNo: number | null;
  unitTitle: string | null;
  topics: TopicMaterialRowData[];
}

export function SubjectTopicsShell({
  subjectName,
  subjectSlug,
  groups,
}: {
  subjectName: string;
  subjectSlug: string;
  groups: UnitTopicGroup[];
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<LibraryFilters>(new Set());
  const query = search.trim().toLowerCase();
  const hasActiveFilter = query.length > 0 || filters.size > 0;

  const visibleGroups = useMemo(() => {
    return groups
      .map((g) => ({
        ...g,
        topics: g.topics.filter((t) => {
          if (query && !t.topicTitle.toLowerCase().includes(query)) return false;
          if (filters.size > 0 && !filters.has(t.difficulty)) return false;
          return true;
        }),
      }))
      .filter((g) => g.topics.length > 0);
  }, [groups, query, filters]);

  const totalTopics = groups.reduce((sum, g) => sum + g.topics.length, 0);

  return (
    <div className="bg-bg mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-5 px-6 py-8">
      <nav className="text-text-secondary flex items-center gap-1.5 text-sm">
        <Link href="/dashboard/answer-book" className="hover:text-text-primary">
          AI Answer Book
        </Link>
        <span>›</span>
        <span className="text-text-primary font-medium">{subjectName}</span>
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-text-primary text-2xl font-semibold">{subjectName}</h1>
          <p className="text-text-secondary text-sm">
            {totalTopics} {totalTopics === 1 ? "topic" : "topics"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search
              className="text-text-secondary pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              strokeWidth={2}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics or materials..."
              className="border-border bg-surface text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:ring-accent-primary w-full rounded-lg border py-2 pr-3 pl-9 text-sm focus:ring-1 focus:outline-none"
            />
          </div>
          <LibraryFilterMenu filters={filters} onChange={setFilters} />
        </div>
      </header>

      {visibleGroups.length === 0 ? (
        <p className="text-text-secondary py-10 text-center text-sm">
          {hasActiveFilter
            ? "No topics match your search or filters."
            : "No topics yet for this subject."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {visibleGroups.map((g) => (
            <div
              key={`${g.unitNo ?? "u"}-${g.unitTitle ?? "untitled"}`}
              className="border-border bg-surface rounded-2xl border p-5"
            >
              {g.unitTitle && (
                <h2 className="text-text-secondary mb-2 text-xs font-semibold tracking-wide uppercase">
                  {g.unitNo !== null ? `Unit ${g.unitNo}: ` : ""}
                  {g.unitTitle}
                </h2>
              )}
              <div className="divide-border flex flex-col divide-y">
                {g.topics.map((t) => (
                  <TopicMaterialRow key={t.topicId} subjectSlug={subjectSlug} topic={t} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
