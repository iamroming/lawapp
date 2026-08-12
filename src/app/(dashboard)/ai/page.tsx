"use client";
import React, { useState, useEffect } from "react";
import AICaseAnalysisPage from "./case-analysis/page";
import AIDraftingPage from "./drafting/page";
import AIChatPage from "./chat/page";
import AISummarizePage from "./summarize/page";
import AIResearchPage from "./research/page";
import { Brain, FileText, MessageSquare, FileSearch, BookOpen, AlertTriangle } from "lucide-react";
import Link from "next/link";

const tabs = [
  { id: "analysis", label: "Case Analysis", icon: Brain },
  { id: "drafting", label: "Drafting", icon: FileText },
  { id: "chat", label: "AI Chat", icon: MessageSquare },
  { id: "research", label: "Research", icon: BookOpen },
  { id: "summarize", label: "Summarize", icon: FileSearch },
];

interface UsageStatus {
  used: number;
  limit: number;
  remaining: number;
  plan: string;
  allowed: boolean;
  isOwnerOrPartner: boolean;
}

export default function AIToolsPage() {
  const [activeTab, setActiveTab] = useState("analysis");
  const [usage, setUsage] = useState<UsageStatus | null>(null);

  useEffect(() => {
    fetch("/api/ai/usage-status")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setUsage(data);
      })
      .catch(() => {});
  }, []);

  const usagePercent = usage && usage.limit > 0 ? Math.round((usage.used / usage.limit) * 100) : 0;
  const isUnlimited = usage?.limit === -1;
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = usage && !isUnlimited && usage.used >= usage.limit;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Tools</h1>
        <p className="text-[var(--text-secondary)]">AI-powered legal research, drafting, and analysis</p>
      </div>

      {/* Usage Bar */}
      {usage && !isUnlimited && (
        <div className={`rounded-lg border p-4 ${isAtLimit ? "bg-red-50 border-red-200" : isNearLimit ? "bg-amber-50 border-amber-200" : "bg-[var(--card)] border-[var(--border)]"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              AI Queries Today: {usage.used}/{usage.limit}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">{usage.plan} Plan</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${isAtLimit ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-[var(--accent)]"}`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          {isAtLimit && (
            <div className="mt-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">Daily limit reached.</span>
              {usage.isOwnerOrPartner ? (
                <Link href="/subscription" className="text-sm font-medium text-[var(--accent)] underline">
                  Upgrade for more
                </Link>
              ) : (
                <span className="text-sm text-[var(--text-secondary)]">
                  Contact the firm owner to upgrade.
                </span>
              )}
            </div>
          )}
          {isNearLimit && !isAtLimit && (
            <p className="mt-2 text-xs text-amber-700">
              You&apos;ve used {usagePercent}% of your daily AI queries.{" "}
              {usage.isOwnerOrPartner ? (
                <Link href="/subscription" className="underline">Upgrade</Link>
              ) : (
                <span>Contact the firm owner to upgrade.</span>
              )}
            </p>
          )}
        </div>
      )}

      <div className="border-b border-[var(--border)]">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        <div style={{ display: activeTab === "analysis" ? "block" : "none" }}><AICaseAnalysisPage /></div>
        <div style={{ display: activeTab === "drafting" ? "block" : "none" }}><AIDraftingPage /></div>
        <div style={{ display: activeTab === "chat" ? "block" : "none" }}><AIChatPage /></div>
        <div style={{ display: activeTab === "research" ? "block" : "none" }}><AIResearchPage /></div>
        <div style={{ display: activeTab === "summarize" ? "block" : "none" }}><AISummarizePage /></div>
      </div>
    </div>
  );
}
