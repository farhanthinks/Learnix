"use client";

import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { TimeSlotFields } from "@/components/subjects/time-slot-fields";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function formatDaysLabel(days: string[]): string {
  if (days.length === 7) return "Daily";
  return days
    .slice()
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
    .map((d) => DAY_LABELS[d] ?? d)
    .join(", ");
}

function formatTimeDisplay(hhmmss: string): string {
  const [h, m] = hhmmss.slice(0, 5).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}:00 ${period}` : `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function SubjectSlotCard({
  subjectId,
  slotStartTime,
  slotEndTime,
  slotDays,
}: {
  subjectId: string;
  slotStartTime: string | null;
  slotEndTime: string | null;
  slotDays: string[] | null;
}) {
  const router = useRouter();
  const hasSlot = Boolean(slotStartTime && slotEndTime && slotDays?.length);
  const [isEditing, setIsEditing] = useState(!hasSlot);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const newStartTime = String(formData.get("slotStartTime") ?? "");
    const newEndTime = String(formData.get("slotEndTime") ?? "");
    const newDays = formData.getAll("slotDays").map(String);

    if (!newStartTime || !newEndTime) {
      setError("Please set a start and end time.");
      return;
    }
    if (newStartTime >= newEndTime) {
      setError("End time must be after start time.");
      return;
    }
    if (newDays.length === 0) {
      setError("Please select at least one study day.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/subjects/${subjectId}/slot`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotStartTime: newStartTime,
          slotEndTime: newEndTime,
          slotDays: newDays,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not save the time slot.");
        setIsSaving(false);
        return;
      }
      setIsEditing(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing && hasSlot) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-accent-primary/10 text-accent-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <Clock className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <p className="text-text-secondary text-xs font-medium">Study Time</p>
            <p className="text-text-primary text-base font-semibold">
              {formatTimeDisplay(slotStartTime!)} – {formatTimeDisplay(slotEndTime!)}
            </p>
            <p className="text-text-secondary text-xs">{formatDaysLabel(slotDays!)}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-auto px-3 py-1.5 text-xs"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!hasSlot && (
        <p className="text-text-secondary text-sm">
          Set a dedicated daily study time for this subject before generating a plan.
        </p>
      )}
      <FormError message={error ?? undefined} />
      <TimeSlotFields
        defaultStartTime={slotStartTime?.slice(0, 5) ?? "18:00"}
        defaultEndTime={slotEndTime?.slice(0, 5) ?? "20:00"}
        defaultDays={slotDays ?? ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]}
        disabled={isSaving}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving} className="w-auto px-4">
          {isSaving ? "Saving..." : "Save time slot"}
        </Button>
        {hasSlot && (
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            className="w-auto px-4"
            onClick={() => {
              setIsEditing(false);
              setError(null);
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
