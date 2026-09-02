"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";

export function EditSubjectModal({
  subjectId,
  name,
  examDate,
  onClose,
}: {
  subjectId: string;
  name: string;
  examDate: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [nameValue, setNameValue] = useState(name);
  const [examDateValue, setExamDateValue] = useState(examDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!nameValue.trim()) {
      setError("Subject name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/subjects/${subjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue.trim(), examDate: examDateValue || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not save changes.");
        setIsSaving(false);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Network error. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit subject"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full max-w-sm rounded-2xl p-6 shadow-xl"
      >
        <h2 className="font-display text-text-primary text-lg font-semibold">Edit Subject</h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <FormError message={error ?? undefined} />
          <Input
            id="edit-subject-name"
            label="Subject name"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            required
            disabled={isSaving}
          />
          <Input
            id="edit-subject-exam-date"
            type="date"
            label="Exam date (optional)"
            value={examDateValue}
            onChange={(e) => setExamDateValue(e.target.value)}
            disabled={isSaving}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-auto px-4"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" className="w-auto px-4" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
