"use client";
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function Modal({ open, onClose, children, title, description, className }: ModalProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    }
    document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className={cn(
            "relative w-full max-w-lg rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-lg max-h-[90vh] overflow-y-auto",
            className
          )}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          {title && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
              {description && <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
