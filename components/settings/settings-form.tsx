"use client";

import { useActionState } from "react";

import { saveStudyPreferences, type SettingsState } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import type { StudyDay } from "@/types/database";

const DAY_OPTIONS: { value: StudyDay; label: string }[] = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

const initialState: SettingsState = {};

export function SettingsForm({
  dailyStudyMinutes,
  studyDays,
  preferredStudyTime,
}: {
  dailyStudyMinutes: number;
  studyDays: string[];
  preferredStudyTime: string;
}) {
  const [state, formAction, isPending] = useActionState(saveStudyPreferences, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <p className="text-text-secondary border-border bg-surface rounded-lg border px-3 py-2 text-xs">
        These preferences are no longer used to generate study plans or calendar exports — each
        subject now has its own dedicated daily time slot, set from that subject&apos;s page.
      </p>

      <FormError message={state.error} />
      {state.success && (
        <p
          role="status"
          className="bg-accent-success/10 text-accent-success rounded-lg px-3 py-2 text-sm"
        >
          Preferences saved.
        </p>
      )}

      <Input
        id="dailyStudyMinutes"
        name="dailyStudyMinutes"
        type="number"
        min={15}
        max={600}
        label="Daily study minutes available"
        defaultValue={dailyStudyMinutes}
        required
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-text-secondary text-sm font-medium">Study days</legend>
        <div className="flex flex-wrap gap-3">
          {DAY_OPTIONS.map((day) => (
            <label
              key={day.value}
              className="border-border text-text-primary flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm"
            >
              <input
                type="checkbox"
                name="studyDays"
                value={day.value}
                defaultChecked={studyDays.includes(day.value)}
                className="border-border bg-surface text-accent-primary focus:ring-accent-primary rounded"
              />
              {day.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Input
        id="preferredStudyTime"
        name="preferredStudyTime"
        type="time"
        label="Preferred daily study start time"
        defaultValue={preferredStudyTime.slice(0, 5)}
        required
      />

      <Button type="submit" disabled={isPending} className="w-auto px-6">
        {isPending ? "Saving..." : "Save preferences"}
      </Button>
    </form>
  );
}
