"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

interface IntakeField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface IntakeForm {
  id: string;
  title: string;
  description: string | null;
  fields: IntakeField[];
  is_active: boolean;
  created_at: string;
}

interface Submission {
  id: string;
  form_id: string;
  submitter_name: string | null;
  submitter_email: string | null;
  responses: Record<string, unknown>;
  status: string;
  created_at: string;
  intake_forms?: { title: string } | null;
}

export default function IntakePage() {
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [expandedForm, setExpandedForm] = useState<string | null>(null);

  const [newForm, setNewForm] = useState({
    title: "",
    description: "",
    fields: [{ id: "1", label: "", type: "text", required: false }] as IntakeField[],
  });
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [formsRes, subsRes] = await Promise.all([
      supabase
        .from("intake_forms")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("intake_submissions")
        .select("*, intake_forms(title)")
        .order("created_at", { ascending: false }),
    ]);

    setForms(formsRes.data || []);
    setSubmissions(
      (subsRes.data || []).filter(
        (s: any) => s.intake_forms?.created_by === user.id
      )
    );
    setLoading(false);
  }

  const addField = () => {
    setNewForm((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id: String(prev.fields.length + 1),
          label: "",
          type: "text",
          required: false,
        },
      ],
    }));
  };

  const removeField = (id: string) => {
    setNewForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== id),
    }));
  };

  const updateField = (id: string, updates: Partial<IntakeField>) => {
    setNewForm((prev) => ({
      ...prev,
      fields: prev.fields.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    }));
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.title.trim()) {
      toast.error("Form title is required");
      return;
    }
    if (newForm.fields.some((f) => !f.label.trim())) {
      toast.error("All fields must have labels");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newForm.title,
          description: newForm.description,
          fields: newForm.fields,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create form");
      }

      toast.success("Intake form created!");
      setShowFormBuilder(false);
      setNewForm({
        title: "",
        description: "",
        fields: [{ id: "1", label: "", type: "text", required: false }],
      });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Intake Forms</h1>
            <p className="text-[var(--text-secondary)]">
              Build forms and manage client submissions
            </p>
          </div>
        </div>
        <Button onClick={() => setShowFormBuilder(!showFormBuilder)}>
          <Plus className="h-4 w-4 mr-1" />
          Create Form
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Builder */}
        <div className="space-y-4">
          {showFormBuilder && (
            <Card>
              <CardHeader>
                <CardTitle>New Intake Form</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateForm} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      Form Title *
                    </label>
                    <Input
                      value={newForm.title}
                      onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                      placeholder="e.g., Family Law Intake Form"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      Description
                    </label>
                    <textarea
                      value={newForm.description}
                      onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-[var(--text-primary)]">
                      Fields
                    </label>
                    {newForm.fields.map((field) => (
                      <div key={field.id} className="flex gap-2 items-start">
                        <Input
                          placeholder="Field label"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="flex-1"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateField(field.id, { type: e.target.value })}
                          className="px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="select">Dropdown</option>
                        </select>
                        <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          />
                          Req
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeField(field.id)}
                          disabled={newForm.fields.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addField}>
                      <Plus className="h-4 w-4 mr-1" /> Add Field
                    </Button>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowFormBuilder(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={formLoading}>
                      {formLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                      Create Form
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Your Forms ({forms.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {forms.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center py-8">
                  No forms created yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {forms.map((form) => (
                    <div key={form.id} className="border rounded-lg p-4">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() =>
                          setExpandedForm(expandedForm === form.id ? null : form.id)
                        }
                      >
                        <div>
                          <p className="font-medium">{form.title}</p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {form.fields.length} fields • Created{" "}
                            {new Date(form.created_at).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={form.is_active ? "success" : "secondary"}>
                            {form.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {expandedForm === form.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      {expandedForm === form.id && (
                        <div className="mt-3 pt-3 border-t">
                          {form.description && (
                              <p className="text-sm text-[var(--text-secondary)] mb-2">{form.description}</p>
                          )}
                          <div className="space-y-1">
                            {form.fields.map((field) => (
                              <div key={field.id} className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{field.label}</span>
                                <Badge variant="outline">{field.type}</Badge>
                                {field.required && (
                                  <Badge variant="destructive">Required</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Submissions ({submissions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-8">
                No submissions yet.
              </p>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div key={sub.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {sub.submitter_name || "Anonymous"}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {sub.intake_forms?.title || "Unknown Form"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          sub.status === "submitted" ? "success" : "secondary"
                        }
                      >
                        {sub.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {Object.entries(sub.responses || {}).map(([key, value]) => (
                        <p key={key}>
                          <span className="font-medium">{key}:</span>{" "}
                          {String(value)}
                        </p>
                      ))}
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-2">
                      {new Date(sub.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
