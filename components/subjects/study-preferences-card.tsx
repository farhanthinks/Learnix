"use client";

import { ChevronDown, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { DAY_OPTIONS } from "@/components/subjects/time-slot-fields";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";

const ALL_DAYS = DAY_OPTIONS.map((d) => d.value);
const DURATION_PRESETS = [5, 10, 15, 20];
const FREQUENCY_PRESETS: { value: number; label: string }[] = [
  { value: 1, label: "After every session" },
  { value: 2, label: "After 2 sessions" },
  { value: 3, label: "After 3 sessions" },
];

const SELECT_CLASS =
  "border-border bg-surface text-text-primary focus:border-accent-primary focus:ring-accent-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none";

function formatTimeDisplay(hhmmss: string): string {
  const [h, m] = hhmmss.slice(0, 5).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}:00 ${period}` : `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function frequencyLabel(frequency: number): string {
  return (
    FREQUENCY_PRESETS.find((f) => f.value === frequency)?.label ?? `After ${frequency} sessions`
  );
}

export function StudyPreferencesCard({
  subjectId,
  disabledReason,
  slotStartTime,
  slotEndTime,
  slotDays,
  breakEnabled: initialBreakEnabled,
  breakMinutes: initialBreakMinutes,
  breakFrequency: initialBreakFrequency,
}: {
  subjectId: string;
  disabledReason?: string;
  slotStartTime: string | null;
  slotEndTime: string | null;
  slotDays: string[] | null;
  breakEnabled: boolean;
  breakMinutes: number | null;
  breakFrequency: number | null;
}) {
  const router = useRouter();
  const hasSlot = Boolean(slotStartTime && slotEndTime && slotDays?.length);
  const [isEditing, setIsEditing] = useState(!hasSlot);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startTime, setStartTime] = useState(slotStartTime?.slice(0, 5) ?? "18:00");
  const [endTime, setEndTime] = useState(slotEndTime?.slice(0, 5) ?? "20:00");
  const [days, setDays] = useState<string[]>(slotDays ?? ALL_DAYS);
  const [showDays, setShowDays] = useState(false);

  const [breaksWanted, setBreaksWanted] = useState(initialBreakEnabled);
  const [durationPreset, setDurationPreset] = useState<number | "custom">(
    initialBreakMinutes && DURATION_PRESETS.includes(initialBreakMinutes)
      ? initialBreakMinutes
      : initialBreakMinutes
        ? "custom"
        : 15,
  );
  const [customDuration, setCustomDuration] = useState(String(initialBreakMinutes ?? 15));
  const [frequencyPreset, setFrequencyPreset] = useState<number | "custom">(
    initialBreakFrequency && FREQUENCY_PRESETS.some((f) => f.value === initialBreakFrequency)
      ? initialBreakFrequency
      : initialBreakFrequency
        ? "custom"
        : 2,
  );
  const [customFrequency, setCustomFrequency] = useState(String(initialBreakFrequency ?? 2));

  function toggleDay(day: string) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSubmit(event: FormEvent, alsoGenerate: boolean) {
    event.preventDefault();
    setError(null);

    if (!startTime || !endTime) {
      setError("Please set a start and end time.");
      return;
    }
    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }
    if (days.length === 0) {
      setError("Please select at least one study day.");
      return;
    }

    const resolvedMinutes = durationPreset === "custom" ? Number(customDuration) : durationPreset;
    const resolvedFrequency =
      frequencyPreset === "custom" ? Number(customFrequency) : frequencyPreset;
    if (breaksWanted && (!Number.isFinite(resolvedMinutes) || resolvedMinutes < 1)) {
      setError("Please enter a valid break duration.");
      return;
    }
    if (breaksWanted && (!Number.isFinite(resolvedFrequency) || resolvedFrequency < 1)) {
      setError("Please enter a valid break frequency.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/subjects/${subjectId}/slot`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotStartTime: startTime,
          slotEndTime: endTime,
          slotDays: days,
          breakEnabled: breaksWanted,
          breakMinutes: breaksWanted ? resolvedMinutes : null,
          breakFrequency: breaksWanted ? resolvedFrequency : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not save your study preferences.");
        setIsSaving(false);
        return;
      }

      if (!alsoGenerate) {
        setIsEditing(false);
        setIsSaving(false);
        router.refresh();
        return;
      }

      const genRes = await fetch(`/api/subjects/${subjectId}/plan`, { method: "POST" });
      const genJson = await genRes.json();
      if (!genRes.ok) {
        setError(genJson.error ?? "Could not generate a plan.");
        setIsSaving(false);
        return;
      }
      router.push("/dashboard/study-plan");
    } catch {
      setError("Network error. Please try again.");
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
            <p className="text-text-secondary text-xs font-medium">Study Preferences</p>
            <p className="text-text-primary text-base font-semibold">
              {formatTimeDisplay(slotStartTime!)} – {formatTimeDisplay(slotEndTime!)}
            </p>
            <p className="text-text-secondary text-xs">
              {initialBreakEnabled
                ? `Breaks: ${initialBreakMinutes} min, ${frequencyLabel(initialBreakFrequency ?? 2).toLowerCase()}`
                : "No breaks"}
            </p>
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
    <form onSubmit={(e) => handleSubmit(e, !hasSlot)} className="flex flex-col gap-4">
      {!hasSlot && (
        <p className="text-text-secondary text-sm">
          A couple of quick preferences before we build your timetable.
        </p>
      )}
      <FormError message={error ?? undefined} />

      <div>
        <p className="text-text-secondary text-sm font-medium">Daily Study Time</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Input
            id="pref-start"
            type="time"
            label="Start time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={isSaving}
            required
          />
          <Input
            id="pref-end"
            type="time"
            label="End time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={isSaving}
            required
          />
        </div>
        <button
          type="button"
          onClick={() => setShowDays((v) => !v)}
          className="text-accent-primary mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline"
        >
          <ChevronDown
            className={`h-3 w-3 transition-transform ${showDays ? "rotate-180" : ""}`}
            strokeWidth={2.5}
          />
          {days.length === 7 ? "Every day" : `${days.length} days/week`} · Customize days
        </button>
        {showDays && (
          <div className="mt-2 flex flex-wrap gap-2">
            {DAY_OPTIONS.map((day) => (
              <label
                key={day.value}
                className={`border-border flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm ${
                  days.includes(day.value)
                    ? "border-accent-primary text-accent-primary"
                    : "text-text-primary"
                }`}
              >
                <input
                  type="checkbox"
                  checked={days.includes(day.value)}
                  onChange={() => toggleDay(day.value)}
                  disabled={isSaving}
                  className="border-border bg-surface text-accent-primary focus:ring-accent-primary rounded"
                />
                {day.label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-text-secondary text-sm font-medium">Breaks</p>
        <p className="text-text-secondary text-xs">Do you want breaks between study sessions?</p>
        <div className="mt-2 flex flex-col gap-1.5">
          <label className="text-text-primary flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="breaksWanted"
              checked={!breaksWanted}
              onChange={() => setBreaksWanted(false)}
              disabled={isSaving}
              className="text-accent-primary"
            />
            No breaks
          </label>
          <label className="text-text-primary flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="breaksWanted"
              checked={breaksWanted}
              onChange={() => setBreaksWanted(true)}
              disabled={isSaving}
              className="text-accent-primary"
            />
            Yes, add breaks
          </label>
        </div>
      </div>

      {breaksWanted && (
        <div className="border-border bg-surface-raised flex flex-col gap-3 rounded-lg border p-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pref-break-duration"
              className="text-text-secondary text-xs font-medium"
            >
              Break duration
            </label>
            <select
              id="pref-break-duration"
              value={durationPreset}
              onChange={(e) =>
                setDurationPreset(e.target.value === "custom" ? "custom" : Number(e.target.value))
              }
              disabled={isSaving}
              className={SELECT_CLASS}
            >
              {DURATION_PRESETS.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            {durationPreset === "custom" && (
              <input
                type="number"
                min={1}
                max={120}
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                disabled={isSaving}
                placeholder="Minutes"
                className={SELECT_CLASS}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pref-break-frequency"
              className="text-text-secondary text-xs font-medium"
            >
              Break frequency
            </label>
            <select
              id="pref-break-frequency"
              value={frequencyPreset}
              onChange={(e) =>
                setFrequencyPreset(e.target.value === "custom" ? "custom" : Number(e.target.value))
              }
              disabled={isSaving}
              className={SELECT_CLASS}
            >
              {FREQUENCY_PRESETS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            {frequencyPreset === "custom" && (
              <input
                type="number"
                min={1}
                max={20}
                value={customFrequency}
                onChange={(e) => setCustomFrequency(e.target.value)}
                disabled={isSaving}
                placeholder="Sessions between breaks"
                className={SELECT_CLASS}
              />
            )}
          </div>
        </div>
      )}

      {disabledReason && <p className="text-text-secondary text-xs">{disabledReason}</p>}

      <div className="flex justify-end gap-2">
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
        <Button
          type="submit"
          disabled={isSaving || Boolean(!hasSlot && disabledReason)}
          className="w-auto px-4"
        >
          {isSaving
            ? hasSlot
              ? "Saving..."
              : "Generating..."
            : hasSlot
              ? "Save Preferences"
              : "Generate Study Plan →"}
        </Button>
      </div>
    </form>
  );
}
