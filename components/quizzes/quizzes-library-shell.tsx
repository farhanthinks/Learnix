"use client";

import { Search, Target } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { QuizSubjectCard, type QuizSubjectData } from "@/components/quizzes/quiz-subject-card";

export interface QuizzesLibrarySubject extends QuizSubjectData {
  topicTitles: string[];
}

export function QuizzesLibraryShell({ subjects }: { subjects: QuizzesLibrarySubject[] }) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();

  const visibleSubjects = useMemo(() => {
    if (!query) return subjects;
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.topicTitles.some((t) => t.toLowerCase().includes(query)),
    );
  }, [subjects, query]);

  return (
    <div className="bg-bg mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-5 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-text-primary text-2xl font-semibold">Quizzes</h1>
          <p className="text-text-secondary text-sm">
            Practice and test what you know, organized by subject.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            className="text-text-secondary pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            strokeWidth={2}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects or topics..."
            className="border-border bg-surface text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:ring-accent-primary w-full rounded-lg border py-2 pr-3 pl-9 text-sm focus:ring-1 focus:outline-none"
          />
        </div>
      </header>

      {subjects.length === 0 ? (
        <div className="border-border bg-surface flex flex-col items-center gap-3 rounded-2xl border py-16 text-center">
          <Target className="text-text-secondary h-8 w-8" strokeWidth={1.5} />
          <div>
            <p className="text-text-primary text-sm font-semibold">No subjects yet</p>
            <p className="text-text-secondary mt-1 text-sm">
              Add a subject with a syllabus to start generating practice quizzes.
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
          No subjects or topics match your search.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleSubjects.map((s) => (
            <QuizSubjectCard key={s.slug} subject={s} />
          ))}
        </div>
      )}
    </div>
  );
}
