"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteSubjectButton({
  subjectId,
  subjectName,
  redirectTo,
  className = "",
}: {
  subjectId: string;
  subjectName: string;
  /** If set, navigate here after a successful delete (use when the button
   * lives on that subject's own page, which is about to stop existing).
   * Otherwise the current route is refreshed in place. */
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const confirmed = window.confirm(
      `Delete ${subjectName}? This removes all its topics and study plan too.`,
    );
    if (!confirmed) return;

    setError(null);
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/subjects/${subjectId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Could not delete the subject.");
        setIsDeleting(false);
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDeleting}
        aria-label={`Delete ${subjectName}`}
        title="Delete subject"
        className={`text-text-secondary hover:bg-accent-danger/10 hover:text-accent-danger focus-visible:outline-accent-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-50 ${className}`}
      >
        <Trash2 className="h-4 w-4" strokeWidth={2} />
      </button>
      {error && (
        <span className="border-accent-danger/30 bg-surface text-accent-danger absolute top-full right-0 z-10 mt-1 w-40 rounded-md border px-2 py-1 text-xs shadow-md">
          {error}
        </span>
      )}
    </span>
  );
}
