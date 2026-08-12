"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { documentTemplates, generateDocument, type DocumentTemplate } from "@/lib/templates";
import { FileText, Download, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const categories = [
  { value: "all", label: "All Templates" },
  { value: "vakalatnama", label: "Vakalatnama (\u0935\u0915\u093e\u0932\u0924\u0928\u093e\u092e\u093e)" },
  { value: "legal_notice", label: "Legal Notice (\u0915\u093e\u0928\u0942\u0928\u0940 \u0928\u094b\u091f\u093f\u0938)" },
  { value: "affidavit", label: "Affidavit (\u0939\u0932\u092b\u0928\u093e\u092e\u093e)" },
  { value: "petition", label: "Petition (\u092f\u093e\u091a\u093f\u0915\u0915\u094b\u0937\u0924\u093e)" },
] as const;

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string>("");

  const filteredTemplates = selectedCategory === "all"
    ? documentTemplates
    : documentTemplates.filter((t) => t.category === selectedCategory);

  const handleSelectTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setFormData({});
    setPreview("");
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handlePreview = () => {
    if (!selectedTemplate) return;
    const missingFields = selectedTemplate.fields
      .filter((f) => f.required && !formData[f.id]?.trim())
      .map((f) => f.label);
    if (missingFields.length > 0) {
      toast.error(`Please fill required fields: ${missingFields.join(", ")}`);
      return;
    }
    const result = generateDocument(selectedTemplate, formData);
    setPreview(result);
  };

  const handleDownload = () => {
    if (!preview) return;
    const blob = new Blob([preview], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTemplate?.id || "document"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Document downloaded!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/documents">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Document Templates</h1>
          <p className="text-muted-foreground">
            Generate legal documents using pre-built templates
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select
          options={categories.map((c) => ({ value: c.value, label: c.label }))}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        />
      </div>

      {selectedTemplate ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selectedTemplate.name}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setSelectedTemplate(null)}>
                  Change Template
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
              <p className="text-sm text-muted-foreground">{selectedTemplate.descriptionHi}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTemplate.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="text-sm font-medium">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                    <span className="text-muted-foreground ml-1">({field.labelHi})</span>
                  </label>
                  {field.type === "textarea" ? (
                    <Textarea
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      rows={4}
                    />
                  ) : field.type === "date" ? (
                    <Input
                      type="date"
                      value={formData[field.id] || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    />
                  ) : (
                    <Input
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-4">
                <Button onClick={handlePreview} className="flex-1">
                  <FileText className="w-4 h-4 mr-2" /> Preview
                </Button>
                {preview && (
                  <Button onClick={handleDownload} variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {preview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg font-mono max-h-[500px] overflow-y-auto">
                  {preview}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleSelectTemplate(template)}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.nameHi}</p>
                    <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                    <p className="text-xs text-muted-foreground">{template.fields.length} fields</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
