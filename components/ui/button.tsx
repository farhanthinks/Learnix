import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent-primary text-white hover:brightness-110 disabled:opacity-50",
  secondary:
    "bg-surface-raised text-text-primary border border-border hover:border-accent-primary disabled:opacity-50",
  outline:
    "border border-border text-text-primary hover:bg-surface-raised disabled:text-text-secondary disabled:opacity-50",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`focus-visible:outline-accent-primary inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-[filter,background-color,border-color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
