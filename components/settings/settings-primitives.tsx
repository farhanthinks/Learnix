import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-border bg-surface rounded-2xl border">
      <div className="border-border flex items-center gap-2.5 border-b px-5 py-3.5">
        <Icon className="text-accent-primary h-4 w-4" strokeWidth={2} />
        <h2 className="text-text-primary text-sm font-semibold">{title}</h2>
      </div>
      <div className="divide-border flex flex-col divide-y px-5">{children}</div>
    </section>
  );
}

export function SettingsRow({
  icon: Icon,
  label,
  description,
  control,
  danger,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  description?: string;
  control?: ReactNode;
  danger?: boolean;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-3 py-3.5 text-left ${onClick ? "hover:bg-surface-raised -mx-5 cursor-pointer px-5 transition-colors" : ""}`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${danger ? "text-accent-danger" : "text-text-secondary"}`}
        strokeWidth={2}
      />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${danger ? "text-accent-danger" : "text-text-primary"}`}>
          {label}
        </p>
        {description && <p className="text-text-secondary text-xs">{description}</p>}
      </div>
      {control && <div className="shrink-0">{control}</div>}
    </Wrapper>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-accent-primary" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
