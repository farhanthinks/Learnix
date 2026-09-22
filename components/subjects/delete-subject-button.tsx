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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeModal() {
    if (isDeleting) return;
    setConfirmOpen(false);
    setError(null);
  }

  async function handleConfirmDelete() {
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
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        aria-label={`Delete ${subjectName}`}
        title="Delete subject"
        className={`text-text-secondary hover:bg-accent-danger/10 hover:text-accent-danger focus-visible:outline-accent-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
      >
        <Trash2 className="h-4 w-4" strokeWidth={2} />
      </button>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Delete ${subjectName}`}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface w-full max-w-sm rounded-2xl p-6 shadow-xl"
          >
            <h2 className="font-display text-text-primary text-lg font-semibold">
              Delete {subjectName}?
            </h2>
            <p className="text-text-secondary mt-2 text-sm">
              This will permanently remove the subject, topics, and study plan.
            </p>

            {error && <p className="text-accent-danger mt-3 text-sm">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={isDeleting}
                className="border-border text-text-primary hover:bg-surface-raised inline-flex w-auto items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-accent-danger inline-flex w-auto items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-[filter] hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Subject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
