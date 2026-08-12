"use client";
import React, { useEffect, useState } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

interface Branch {
  id: string;
  name: string;
}

const STORAGE_KEY = "casefiles_selected_branch";

export function BranchSwitcher() {
  const { user: appUser } = useUser();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchBranches = async () => {
      if (!appUser) return;

      const res = await fetch("/api/branches");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setBranches(data);
        // Restore saved selection
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && data.some((b: Branch) => b.id === saved)) {
          setSelectedBranchId(saved);
        }
      }
      setLoading(false);
    };
    fetchBranches();
  }, [appUser]);

  // Publish branch selection to window for other components to read
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__selectedBranchId = selectedBranchId;
      window.dispatchEvent(new CustomEvent("branch-changed", { detail: { branchId: selectedBranchId } }));
    }
  }, [selectedBranchId]);

  const handleSelect = (branchId: string | null) => {
    setSelectedBranchId(branchId);
    if (branchId) {
      localStorage.setItem(STORAGE_KEY, branchId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setOpen(false);
  };

  if (loading || branches.length === 0) return null;

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  return (
    <div className="relative px-3 py-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--surface-subtle)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[var(--text-secondary)]" />
          <span className="truncate">
            {selectedBranch ? selectedBranch.name : "All Branches"}
          </span>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
            <button
              onClick={() => handleSelect(null)}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-[var(--surface-subtle)]",
                !selectedBranchId && "bg-[var(--surface-subtle)]"
              )}
            >
              <span>All Branches</span>
              {!selectedBranchId && <Check className="h-4 w-4 text-[var(--accent)]" />}
            </button>
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleSelect(branch.id)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-[var(--surface-subtle)]",
                  selectedBranchId === branch.id && "bg-[var(--surface-subtle)]"
                )}
              >
                <span>{branch.name}</span>
                {selectedBranchId === branch.id && <Check className="h-4 w-4 text-[var(--accent)]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Hook to get selected branch ID in other components
export function useSelectedBranch(): string | null {
  const [branchId, setBranchId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY);
    }
    return null;
  });

  useEffect(() => {
    const handler = (e: CustomEvent) => setBranchId(e.detail.branchId);
    window.addEventListener("branch-changed", handler as EventListener);
    return () => window.removeEventListener("branch-changed", handler as EventListener);
  }, []);

  return branchId;
}
