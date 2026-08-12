"use client";
import React, { useState } from "react";
import ReportsOverviewTab from "./_components/overview-tab";
import FinancialAnalyticsPage from "./financial/page";
import TeamAnalyticsPage from "./team/page";
import ClientDeepAnalyticsPage from "./clients-deep/page";
import { BarChart3, IndianRupee, Users, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "financial", label: "Financial", icon: IndianRupee },
  { id: "team", label: "Team", icon: Users },
  { id: "clients", label: "Clients", icon: TrendingUp },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-[var(--text-secondary)]">Comprehensive insights into your practice</p>
        </div>
        <Button variant="outline" onClick={() => window.open("/api/export/reports-pdf", "_blank")}>
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
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
        {activeTab === "overview" && <ReportsOverviewTab />}
        {activeTab === "financial" && <FinancialAnalyticsPage />}
        {activeTab === "team" && <TeamAnalyticsPage />}
        {activeTab === "clients" && <ClientDeepAnalyticsPage />}
      </div>
    </div>
  );
}
