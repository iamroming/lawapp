"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Loader2,
  Copy,
  Download,
  Plus,
  Trash2,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  LEGAL_DOCUMENT_TYPES,
  INDIAN_JURISDICTIONS,
} from "@/lib/ai/drafting-constants";
import { downloadLegalDocPDF } from "@/lib/ai/legal-doc-pdf";
import toast from "react-hot-toast";
import { useAiUsage } from "@/hooks/use-ai-usage";
import Link from "next/link";

interface PartyField {
  label: string;
  value: string;
}

const PARTY_FIELDS_BY_DOC: Record<string, string[]> = {
  civil_plaint: ["Plaintiff Name", "Defendant Name", "Plaintiff Address", "Defendant Address"],
  criminal_complaint: ["Complainant Name", "Accused Name", "Police Station", "FIR Number"],
  writ_petition: ["Petitioner Name", "Respondent (State/Authority)", "Petitioner Address"],
  legal_notice: ["Sender Name", "Sender Address", "Recipient Name", "Recipient Address", "Subject"],
  affidavit: ["Deponent Name", "Father/Husband Name", "Deponent Address"],
  vakalatnama: ["Client Name", "Father Name", "Client Address", "Advocate Name", "Enrollment Number", "Court Name", "Opposite Party"],
  agreement: ["Party A Name", "Party A Address", "Party B Name", "Party B Address", "Agreement Subject"],
  memorandum: ["Party A Name", "Party B Name", "Purpose", "Duration"],
  power_of_attorney: ["Principal Name", "Principal Address", "Agent Name", "Agent Address", "Scope of Authority"],
  bail_application: ["Accused Name", "Father Name", "Accused Address", "Police Station", "FIR Number", "Sections"],
  anticipatory_bail: ["Accused Name", "Father Name", "Accused Address", "Police Station", "FIR Number", "Sections"],
  divorce_petition: ["Petitioner Name", "Respondent Name", "Marriage Date", "Marriage Address"],
  maintenance_application: ["Applicant Name", "Respondent Name", "Relationship", "Marriage Date"],
  child_custody: ["Petitioner Name", "Respondent Name", "Child Name", "Child Age"],
  property_sale_deed: ["Seller Name", "Seller Address", "Buyer Name", "Buyer Address", "Property Description", "Sale Consideration"],
  rental_agreement: ["Landlord Name", "Landlord Address", "Tenant Name", "Tenant Address", "Property Address", "Monthly Rent", "Security Deposit", "Lease Duration"],
  service_notice: ["Sender Name", "Sender Address", "Recipient Name", "Recipient Address", "Subject"],
  consumer_complaint: ["Complainant Name", "Complainant Address", "Opposite Party Name", "Opposite Party Address", "Product/Service Description"],
};

export default function AIDraftingPage() {
  const [documentType, setDocumentType] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [partyFields, setPartyFields] = useState<PartyField[]>([]);
  const [facts, setFacts] = useState("");
  const [reliefSought, setReliefSought] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const { usage, isAtLimit, isUnlimited, refreshUsage } = useAiUsage();

  const handleDocTypeChange = (value: string) => {
    setDocumentType(value);
    const fieldLabels = PARTY_FIELDS_BY_DOC[value] || [];
    setPartyFields(fieldLabels.map((label) => ({ label, value: "" })));
  };

  const updatePartyField = (index: number, value: string) => {
    setPartyFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, value } : f))
    );
  };

  const removePartyField = (index: number) => {
    setPartyFields((prev) => prev.filter((_, i) => i !== index));
  };

  const addPartyField = () => {
    setPartyFields((prev) => [...prev, { label: "Custom Field", value: "" }]);
  };

  const handleGenerate = async () => {
    if (!documentType) {
      toast.error("Please select a document type");
      return;
    }
    if (!facts.trim() || facts.trim().length < 10) {
      toast.error("Please provide facts (min 10 characters)");
      return;
    }

    setLoading(true);
    try {
      const partyDetails = partyFields
        .filter((f) => f.value)
        .map((f) => `${f.label}: ${f.value}`)
        .join("\n");

      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          jurisdiction,
          partyDetails,
          facts,
          reliefSought,
          additionalInstructions,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Draft generation failed");
      }

      const { data } = await res.json();
      setResult(data);
      toast.success("Document drafted successfully!");
      refreshUsage();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Draft failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      toast.success("Copied to clipboard!");
    }
  };

  const handleDownloadPDF = () => {
    if (result) {
      downloadLegalDocPDF(
        {
          title: result.title,
          content: result.content,
          jurisdiction,
        },
        `${result.title.replace(/\s+/g, "-").toLowerCase()}.pdf`
      );
      toast.success("PDF downloaded!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-[var(--text-accent)]" />
        <div>
          <h1 className="text-2xl font-bold">AI Legal Drafting</h1>
          <p className="text-[var(--text-secondary)]">
            Generate legal documents with AI assistance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[var(--text-accent)]" />
                Document Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Document Type *
                </label>
                <Select
                  options={LEGAL_DOCUMENT_TYPES}
                  value={documentType}
                  onChange={(e) => handleDocTypeChange(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Jurisdiction
                </label>
                <Select
                  options={INDIAN_JURISDICTIONS}
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Party Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {partyFields.map((field, index) => (
                <div key={index} className="flex gap-2">
                  <div className="w-1/3">
                    <Input
                      value={field.label}
                      onChange={(e) =>
                        setPartyFields((prev) =>
                          prev.map((f, i) =>
                            i === index ? { ...f, label: e.target.value } : f
                          )
                        )
                      }
                    />
                  </div>
                  <div className="flex-1 flex gap-1">
                    <Input
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={field.value}
                      onChange={(e) => updatePartyField(index, e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePartyField(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addPartyField}>
                <Plus className="h-4 w-4 mr-1" /> Add Field
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Case Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Facts of the Case *
                </label>
                <Textarea
                  placeholder="Describe the facts of the case in detail..."
                  rows={6}
                  value={facts}
                  onChange={(e) => setFacts(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Relief Sought
                </label>
                <Textarea
                  placeholder="What relief are you seeking from the court?"
                  rows={3}
                  value={reliefSought}
                  onChange={(e) => setReliefSought(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Additional Instructions
                </label>
                <Textarea
                  placeholder="Any specific instructions or requirements..."
                  rows={2}
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || isAtLimit}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isAtLimit ? (
                  <Lock className="h-4 w-4 mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {isAtLimit ? "Limit Reached" : "Generate Document"}
              </Button>
              {usage && !isUnlimited && (
                <p className={`text-xs mt-1 ${isAtLimit ? "text-red-600" : "text-[var(--text-secondary)]"}`}>
                  {usage.used}/{usage.limit} queries used today
                  {isAtLimit && (
                    usage.isOwnerOrPartner ? (
                      <Link href="/subscription" className="ml-2 underline font-medium">Upgrade</Link>
                    ) : (
                      <span className="ml-2">Contact owner to upgrade</span>
                    )
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Result Section */}
        <div>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Generated Document</CardTitle>
              {result && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4 mr-1" /> PDF
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="prose prose-sm max-w-none">
                  <h2 className="text-lg font-bold text-center mb-4">
                    {result.title}
                  </h2>
                  <div className="whitespace-pre-wrap text-sm text-[var(--text-primary)] leading-relaxed">
                    {result.content}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="h-16 w-16 text-[var(--text-tertiary)] mb-4" />
                  <h3 className="text-lg font-medium text-[var(--text-primary)]">
                    No Document Generated
                  </h3>
                  <p className="text-[var(--text-secondary)] mt-1">
                    Fill in the details on the left and click Generate to create
                    your legal document.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
