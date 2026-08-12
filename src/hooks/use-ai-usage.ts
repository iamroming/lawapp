"use client";
import { useState, useEffect } from "react";

interface AiUsage {
  used: number;
  limit: number;
  remaining: number;
  plan: string;
  allowed: boolean;
  isOwnerOrPartner: boolean;
}

export function useAiUsage() {
  const [usage, setUsage] = useState<AiUsage | null>(null);

  const fetchUsage = () => {
    fetch("/api/ai/usage-status")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setUsage(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const isUnlimited = usage?.limit === -1;
  const isAtLimit = usage !== null && !isUnlimited && usage.used >= usage.limit;

  return { usage, isAtLimit, isUnlimited, refreshUsage: fetchUsage };
}
