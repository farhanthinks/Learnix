"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { TimeSlotFields } from "@/components/subjects/time-slot-fields";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { MAX_SYLLABUS_FILE_SIZE } from "@/lib/constants";

export function SubjectForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const file = formData.get("syllabus");
    const slotStartTime = String(formData.get("slotStartTime") ?? "");
    const slotEndTime = String(formData.get("slotEndTime") ?? "");
    const slotDays = formData.getAll("slotDays").map(String);

    if (!name) {
      setError("Please enter a subject name.");
      return;
    }
    if (!(file instanceof File) || file.size === 0) {
      setError("Please choose a syllabus PDF.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    if (file.size > MAX_SYLLABUS_FILE_SIZE) {
      setError("File is too large. Max size is 10MB.");
      return;
    }
    if (!slotStartTime || !slotEndTime) {
      setError("Please set a daily study start and end time.");
      return;
    }
    if (slotStartTime >= slotEndTime) {
      setError("End time must be after start time.");
      return;
    }
    if (slotDays.length === 0) {
      setError("Please select at least one study day.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/subjects", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/dashboard/subjects/${json.slug}`);
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormError message={error ?? undefined} />
      <Input
        id="name"
        name="name"
        label="Subject name"
        placeholder="e.g. Organic Chemistry"
        required
        disabled={isSubmitting}
      />
      <Input
        id="examDate"
        name="examDate"
        type="date"
        label="Exam date (optional)"
        disabled={isSubmitting}
      />

      <TimeSlotFields
        defaultStartTime="18:00"
        defaultEndTime="20:00"
        defaultDays={["mon", "tue", "wed", "thu", "fri", "sat", "sun"]}
        disabled={isSubmitting}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="syllabus" className="text-text-secondary text-sm font-medium">
          Syllabus PDF
        </label>
        <input
          id="syllabus"
          name="syllabus"
          type="file"
          accept="application/pdf,.pdf"
          required
          disabled={isSubmitting}
          className="border-border bg-surface text-text-primary file:bg-surface-raised file:text-text-primary hover:file:bg-border w-full rounded-lg border px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
        <p className="text-text-secondary text-xs">PDF only, max 10MB.</p>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Processing your syllabus..." : "Add Subject"}
      </Button>
      {isSubmitting && (
        <p className="text-text-secondary text-center text-xs">
          This can take up to 30 seconds while the AI reads your syllabus.
        </p>
      )}
    </form>
  );
}
