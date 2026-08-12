"use client";
import React, { useState } from "react";
import BillingInvoicesTab from "./_components/billing-invoices";
import OutstandingTab from "./_components/outstanding-tab";
import CollectionsTab from "./_components/collections-tab";
import { Receipt, IndianRupee, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const tabs = [
  { id: "invoices", label: "Overview", icon: Receipt },
  { id: "outstanding", label: "Outstanding", icon: IndianRupee },
  { id: "collections", label: "Collections", icon: TrendingUp },
];

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("invoices");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-[var(--text-secondary)]">Track invoices, payments, and collections</p>
        </div>
        <Button variant="outline" onClick={() => window.open("/api/export/billing-excel", "_blank")}>
          <Download className="h-4 w-4 mr-2" />
          Export Excel
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
        {activeTab === "invoices" && <BillingInvoicesTab />}
        {activeTab === "outstanding" && <OutstandingTab />}
        {activeTab === "collections" && <CollectionsTab />}
      </div>
    </div>
  );
}
