"use client";
import React, { useState } from "react";
import ECourtsPage from "@/app/(dashboard)/ecourts/page";
import CauseListPage from "@/app/(dashboard)/cause-list/page";
import ResearchPage from "@/app/(dashboard)/research/page";
import { Globe, Calendar, Search } from "lucide-react";

const tabs = [
  { id: "ecourts", label: "eCourts", icon: Globe },
  { id: "cause-list", label: "Cause List", icon: Calendar },
  { id: "research", label: "Research", icon: Search },
];

export default function CourtTrackingPage() {
  const [activeTab, setActiveTab] = useState("ecourts");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Court Tracking</h1>
        <p className="text-[var(--text-secondary)]">Track cases, cause lists, and legal research</p>
      </div>

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
        {activeTab === "ecourts" && <ECourtsPage />}
        {activeTab === "cause-list" && <CauseListPage />}
        {activeTab === "research" && <ResearchPage />}
      </div>
    </div>
  );
}
