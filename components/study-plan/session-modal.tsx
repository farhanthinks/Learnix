"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { formatDateISO } from "@/lib/calendar/session";
import type { CalendarSession } from "@/lib/calendar/session";
import type { CalendarEventType, TopicDifficulty } from "@/types/database";

const TYPE_OPTIONS: { value: CalendarEventType; label: string }[] = [
  { value: "study", label: "Study" },
  { value: "revision", label: "Revision" },
  { value: "practice", label: "Practice" },
  { value: "exam", label: "Exam" },
  { value: "other", label: "Other" },
];

const DIFFICULTY_OPTIONS: { value: TopicDifficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const SELECT_CLASSES =
  "border-border bg-surface text-text-primary focus:border-accent-primary focus:ring-accent-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none";

export function SessionModal({
  subjects,
  initialDate,
  editingSession,
  defaultType,
  onClose,
  onSaved,
}: {
  subjects: { id: string; name: string; slug: string }[];
  initialDate: Date;
  editingSession: CalendarSession | null;
  defaultType: CalendarEventType;
  onClose: () => void;
  onSaved: (session: CalendarSession) => void;
}) {
  const isEdit = Boolean(editingSession);
  const [title, setTitle] = useState(editingSession?.title ?? "");
  const [subjectId, setSubjectId] = useState(editingSession?.subjectId ?? "");
  const [date, setDate] = useState(editingSession?.date ?? formatDateISO(initialDate));
  const [startTime, setStartTime] = useState(editingSession?.startTime ?? "18:00");
  const [endTime, setEndTime] = useState(editingSession?.endTime ?? "19:00");
  const [type, setType] = useState<CalendarEventType>(editingSession?.type ?? defaultType);
  const [difficulty, setDifficulty] = useState<TopicDifficulty | "">(
    editingSession?.difficulty ?? "",
  );
  const [notes, setNotes] = useState(editingSession?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }
    if (!startTime || !endTime) {
      setError("Start and end time are required.");
      return;
    }
    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    const payload = {
      title: title.trim(),
      subjectId: subjectId || null,
      scheduledDate: date,
      startTime,
      endTime,
      eventType: type,
      difficulty: difficulty || null,
      notes: notes.trim() || null,
    };

    setIsSaving(true);
    try {
      const res = await fetch(
        isEdit ? `/api/calendar-events/${editingSession!.rawId}` : "/api/calendar-events",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not save the session.");
        setIsSaving(false);
        return;
      }

      const matchedSubject = subjects.find((s) => s.id === subjectId);
      onSaved({
        id: `event:${isEdit ? editingSession!.rawId : json.id}`,
        rawId: isEdit ? editingSession!.rawId : json.id,
        source: "event",
        title: payload.title,
        subjectId: payload.subjectId,
        subjectSlug: matchedSubject?.slug ?? null,
        subjectName: matchedSubject?.name ?? null,
        topicId: editingSession?.topicId ?? null,
        topicSlug: editingSession?.topicSlug ?? null,
        date: payload.scheduledDate,
        startTime: payload.startTime,
        endTime: payload.endTime,
        type: payload.eventType,
        difficulty: payload.difficulty,
        status: editingSession?.status ?? "pending",
        notes: payload.notes,
        timeEditable: true,
      });
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
        aria-label={isEdit ? "Edit session" : "Add session"}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6 shadow-xl"
      >
        <h2 className="font-display text-text-primary text-lg font-semibold">
          {isEdit ? "Edit Session" : "Add Study Session"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <FormError message={error ?? undefined} />

          <Input
            id="cal-title"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Network Fundamentals"
            required
            disabled={isSaving}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cal-subject" className="text-text-secondary text-sm font-medium">
              Subject (optional)
            </label>
            <select
              id="cal-subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={isSaving}
              className={SELECT_CLASSES}
            >
              <option value="">No subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="cal-date"
            type="date"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={isSaving}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="cal-start"
              type="time"
              label="Start Time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              disabled={isSaving}
            />
            <Input
              id="cal-end"
              type="time"
              label="End Time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cal-type" className="text-text-secondary text-sm font-medium">
                Type
              </label>
              <select
                id="cal-type"
                value={type}
                onChange={(e) => setType(e.target.value as CalendarEventType)}
                disabled={isSaving}
                className={SELECT_CLASSES}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cal-difficulty" className="text-text-secondary text-sm font-medium">
                Difficulty (optional)
              </label>
              <select
                id="cal-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as TopicDifficulty | "")}
                disabled={isSaving}
                className={SELECT_CLASSES}
              >
                <option value="">None</option>
                {DIFFICULTY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cal-notes" className="text-text-secondary text-sm font-medium">
              Notes (optional)
            </label>
            <textarea
              id="cal-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSaving}
              rows={3}
              className="border-border bg-surface text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:ring-accent-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
            />
          </div>

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
              {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Create Session"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
