import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-text-secondary text-sm font-medium">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={`border-border bg-surface text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:ring-accent-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none ${className}`}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = "Input";
