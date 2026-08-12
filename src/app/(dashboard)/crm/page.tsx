"use client";
import React, { useState } from "react";
import ConsultationsPage from "@/app/(dashboard)/consultations/page";
import IntakePage from "@/app/(dashboard)/intake/page";
import { Calendar, ClipboardList } from "lucide-react";

const tabs = [
  { id: "consultations", label: "Consultations", icon: Calendar },
  { id: "intake", label: "Intake Forms", icon: ClipboardList },
];

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState("consultations");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CRM</h1>
        <p className="text-[var(--text-secondary)]">Manage consultations and client intake</p>
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
        {activeTab === "consultations" && <ConsultationsPage />}
        {activeTab === "intake" && <IntakePage />}
      </div>
    </div>
  );
}
