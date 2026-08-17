"use client";
import React, { useState, lazy, Suspense } from "react";
import ReportsOverviewTab from "./_components/overview-tab";
const ProfitLossTab = lazy(() => import("./_components/profit-loss-tab"));
const FinancialAnalyticsPage = lazy(() => import("./financial/page"));
const TeamAnalyticsPage = lazy(() => import("./team/page"));
const ClientDeepAnalyticsPage = lazy(() => import("./clients-deep/page"));
import { BarChart3, IndianRupee, Users, TrendingUp, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "profit-loss", label: "Profit & Loss", icon: IndianRupee },
  { id: "financial", label: "Analytics", icon: TrendingUp },
  { id: "team", label: "Team", icon: Users },
  { id: "clients", label: "Clients", icon: FileText },
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
        {activeTab === "profit-loss" && <Suspense fallback={<div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>}><ProfitLossTab /></Suspense>}
        {activeTab === "financial" && <Suspense fallback={<div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>}><FinancialAnalyticsPage /></Suspense>}
        {activeTab === "team" && <Suspense fallback={<div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>}><TeamAnalyticsPage /></Suspense>}
        {activeTab === "clients" && <Suspense fallback={<div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>}><ClientDeepAnalyticsPage /></Suspense>}
      </div>
    </div>
  );
}
