"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { INVOICE_TEMPLATES, type InvoiceTemplateId } from "@/lib/invoices/templates";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  currentTemplate?: string;
  onSave?: () => void;
}

export function InvoiceTemplateSettings({ currentTemplate = "classic", onSave }: Props) {
  const [selected, setSelected] = useState<InvoiceTemplateId>(currentTemplate as InvoiceTemplateId);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("profiles").update({ invoice_template: selected }).eq("id", user.id);
      if (error) toast.error(error.message);
      else { toast.success("Template saved!"); onSave?.(); }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const templateColors: Record<string, string> = {
    classic: "from-blue-500 to-blue-700",
    modern: "from-emerald-500 to-emerald-700",
    minimal: "from-gray-400 to-gray-600",
    professional: "from-slate-700 to-slate-900",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Invoice Template</h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Choose a design template for your invoices</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {INVOICE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setSelected(tmpl.id)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  selected === tmpl.id
                    ? "border-blue-500 bg-[var(--surface-subtle)] shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:bg-[var(--surface-subtle)]"
                }`}
              >
                {selected === tmpl.id && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="h-5 w-5 text-[var(--text-accent)]" />
                  </div>
                )}
                <div className={`h-24 rounded-lg bg-gradient-to-br ${templateColors[tmpl.id]} mb-3 flex items-center justify-center relative overflow-hidden`}>
                  <div className="bg-white/90 rounded shadow-sm p-2 w-[85%] h-[80%]">
                    <div className="h-2 bg-gray-200 rounded w-1/3 mb-1.5"></div>
                    <div className="h-1 bg-gray-100 rounded w-1/2 mb-2"></div>
                    <div className="h-1 bg-gray-100 rounded w-full mb-1"></div>
                    <div className="h-1 bg-gray-100 rounded w-full mb-1"></div>
                    <div className="h-1 bg-gray-100 rounded w-3/4 mb-1.5"></div>
                    <div className="flex gap-1">
                      <div className="h-1 bg-blue-200 rounded flex-1"></div>
                      <div className="h-1 bg-blue-200 rounded flex-1"></div>
                      <div className="h-1 bg-blue-200 rounded flex-1"></div>
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-[var(--text-primary)]">{tmpl.name}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{tmpl.description}</p>
                {selected === tmpl.id && (
                  <Badge className="mt-2 bg-[var(--surface-accent)] text-[var(--text-accent)] text-xs">Selected</Badge>
                )}
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={saving} className="px-8">
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
