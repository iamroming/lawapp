"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onChange, disabled, className }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 focus-visible:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-[var(--accent)]" : "bg-gray-200",
          className
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    );
  }
);
Toggle.displayName = "Toggle";

export { Toggle };
