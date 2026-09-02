"use client";

import { BookOpen, Check, Clock, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  SubjectFilterMenu,
  emptyFilters,
  type SubjectFilters,
} from "@/components/subjects/subject-filter-menu";
import { SubjectRow, type SubjectRowData } from "@/components/subjects/subject-row";
import { SummaryCard } from "@/components/study-plan/summary-card";
import { formatDurationLabel } from "@/lib/calendar/session";

export interface StudyTip {
  subjectName: string;
  subjectSlug: string;
  daysLeft: number;
  topicsRemaining: number;
}

function percentOf(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function matchesFilters(subject: SubjectRowData, filters: SubjectFilters): boolean {
  if (filters.status.size > 0 && !filters.status.has(subject.status)) return false;

  if (filters.examWindow.size > 0) {
    if (subject.daysUntilExam === null) return false;
    const isUpcoming = subject.daysUntilExam <= 30;
    const matches =
      (filters.examWindow.has("upcoming") && isUpcoming) ||
      (filters.examWindow.has("later") && !isUpcoming);
    if (!matches) return false;
  }

  if (filters.progress.size > 0) {
    const percent = percentOf(subject.topicsDone, subject.topicsTotal);
    const band =
      percent <= 25 ? "0-25" : percent <= 50 ? "26-50" : percent <= 75 ? "51-75" : "76-100";
    if (!filters.progress.has(band)) return false;
  }

  return true;
}

export function SubjectsListShell({
  subjects,
  totalStudyMinutesThisMonth,
  tip,
}: {
  subjects: SubjectRowData[];
  totalStudyMinutesThisMonth: number;
  tip: StudyTip | null;
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<SubjectFilters>(emptyFilters());

  const totalTopicsDone = subjects.reduce((sum, s) => sum + s.topicsDone, 0);
  const totalTopicsTotal = subjects.reduce((sum, s) => sum + s.topicsTotal, 0);
  const overallPercent = percentOf(totalTopicsDone, totalTopicsTotal);

  const trimmedSearch = search.trim().toLowerCase();
  const visibleSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (trimmedSearch && !s.name.toLowerCase().includes(trimmedSearch)) return false;
      return matchesFilters(s, filters);
    });
  }, [subjects, trimmedSearch, filters]);

  return (
    <div className="bg-bg mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-5 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-text-primary text-2xl font-semibold">Subjects</h1>
          <p className="text-text-secondary text-sm">
            Manage your subjects, track progress, and stay ready for your exams.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects..."
            className="border-border bg-surface text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:ring-accent-primary w-56 rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
          />
          <SubjectFilterMenu filters={filters} onChange={setFilters} />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={BookOpen}
          iconClassName="bg-accent-primary/10 text-accent-primary"
          label="Total Subjects"
          value={String(subjects.length)}
          hint="Active subjects"
        />
        <SummaryCard
          icon={TrendingUp}
          iconClassName="bg-accent-success/10 text-accent-success"
          label="Overall Progress"
          value={`${overallPercent}%`}
          hint="Across all subjects"
        />
        <SummaryCard
          icon={Clock}
          iconClassName="bg-accent-warning/10 text-accent-warning"
          label="Total Study Time"
          value={formatDurationLabel(totalStudyMinutesThisMonth)}
          hint="This month"
        />
        <SummaryCard
          icon={Check}
          iconClassName="bg-accent-primary/10 text-accent-primary"
          label="Topics Completed"
          value={`${totalTopicsDone} / ${totalTopicsTotal}`}
          hint="All time"
        />
      </div>

      <div className="border-border bg-surface rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-text-primary text-base font-semibold">Your Subjects</h2>
          <Link
            href="/dashboard/subjects/new"
            className="bg-accent-primary inline-flex w-auto items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white hover:brightness-110"
          >
            + Add Subject
          </Link>
        </div>

        {subjects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <BookOpen className="text-text-secondary h-8 w-8" strokeWidth={1.5} />
            <div>
              <p className="text-text-primary text-sm font-semibold">No subjects yet</p>
              <p className="text-text-secondary mt-1 text-sm">
                Upload your syllabus and let Learnix turn it into an organized learning plan.
              </p>
            </div>
            <Link
              href="/dashboard/subjects/new"
              className="bg-accent-primary mt-1 inline-flex w-auto items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white hover:brightness-110"
            >
              + Add Subject
            </Link>
          </div>
        ) : visibleSubjects.length === 0 ? (
          <p className="text-text-secondary py-10 text-center text-sm">
            No subjects match your search or filters.
          </p>
        ) : (
          <div className="mt-2">
            {visibleSubjects.map((s, i) => (
              <SubjectRow key={s.id} subject={s} index={i} />
            ))}
          </div>
        )}
      </div>

      {tip && (
        <div className="border-accent-primary/30 bg-accent-primary/5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="text-accent-primary mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <div>
              <p className="text-text-primary text-sm font-semibold">Study Tip</p>
              <p className="text-text-secondary mt-0.5 text-sm">
                Your {tip.subjectName} exam is in {tip.daysLeft}{" "}
                {tip.daysLeft === 1 ? "day" : "days"}. You have {tip.topicsRemaining} topic
                {tip.topicsRemaining === 1 ? "" : "s"} remaining.
              </p>
            </div>
          </div>
          <Link
            href={`/dashboard/study-plan?subject=${tip.subjectSlug}`}
            className="text-accent-primary shrink-0 text-sm font-medium hover:underline"
          >
            Go to Study Plan →
          </Link>
        </div>
      )}
    </div>
  );
}
