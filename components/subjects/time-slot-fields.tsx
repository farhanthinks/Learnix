import { Input } from "@/components/ui/input";

export const DAY_OPTIONS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

export function TimeSlotFields({
  defaultStartTime,
  defaultEndTime,
  defaultDays,
  disabled,
}: {
  defaultStartTime?: string;
  defaultEndTime?: string;
  defaultDays?: string[];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-text-secondary text-sm font-medium">
          What time will you study this subject daily?
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Input
            id="slotStartTime"
            name="slotStartTime"
            type="time"
            label="Start time"
            defaultValue={defaultStartTime}
            disabled={disabled}
            required
          />
          <Input
            id="slotEndTime"
            name="slotEndTime"
            type="time"
            label="End time"
            defaultValue={defaultEndTime}
            disabled={disabled}
            required
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-text-secondary text-sm font-medium">Which days?</legend>
        <div className="flex flex-wrap gap-3">
          {DAY_OPTIONS.map((day) => (
            <label
              key={day.value}
              className="border-border text-text-primary flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm"
            >
              <input
                type="checkbox"
                name="slotDays"
                value={day.value}
                defaultChecked={defaultDays?.includes(day.value)}
                disabled={disabled}
                className="border-border bg-surface text-accent-primary focus:ring-accent-primary rounded"
              />
              {day.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
