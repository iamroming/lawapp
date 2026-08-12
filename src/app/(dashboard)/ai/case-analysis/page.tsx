"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Scale,
  AlertTriangle,
  CheckCircle,
  Loader2,
  BookOpen,
  Lightbulb,
  XCircle,
  TrendingUp,
  Copy,
  Download,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import { useAiUsage } from "@/hooks/use-ai-usage";
import Link from "next/link";

interface Precedent {
  id: string;
  caseName: string;
  citation: string;
  court: string;
  year: number;
  relevance: number;
  summary: string;
}

interface Strategy {
  id: string;
  title: string;
  description: string;
  probability: number;
  estimatedCost: string;
  risks: string[];
  benefits: string[];
}

interface AnalysisResult {
  caseId: string;
  caseTitle: string;
  strength: number;
  riskLevel: string;
  keyIssues: string[];
  suggestedStrategies: Strategy[];
  relevantPrecedents: Precedent[];
  summary: string;
  nextSteps: string[];
  estimatedDuration: string;
  potentialOutcome: string;
}

interface CaseItem {
  id: string;
  title: string;
  case_type: string;
  description: string;
  status: string;
  court: string;
  client: { full_name: string } | null;
}

export default function AICaseAnalysisPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [caseType, setCaseType] = useState("civil");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const { usage, isAtLimit, isUnlimited, refreshUsage } = useAiUsage();

  useEffect(() => {
    fetch("/api/cases")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCases(data);
      })
      .catch(() => {});
  }, []);

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  const handleCaseSelect = (caseId: string) => {
    setSelectedCaseId(caseId);
    const c = cases.find((cas) => cas.id === caseId);
    if (c) {
      setCaseType(c.case_type || "civil");
      const parts = [
        c.title,
        c.description,
        c.client ? `Client: ${c.client.full_name}` : "",
        c.court ? `Court: ${c.court}` : "",
        `Status: ${c.status}`,
      ].filter(Boolean);
      setCaseDescription(parts.join("\n"));
    } else {
      setCaseDescription("");
    }
  };

  const handleAnalyze = async () => {
    if (!caseDescription.trim()) {
      toast.error("Please describe your case");
      return;
    }

    setAnalyzing(true);
    setResult(null);
    try {
      const body: Record<string, string> = {
        description: caseDescription,
        case_type: caseType,
      };
      if (selectedCase) {
        body.caseId = selectedCase.id;
        body.title = selectedCase.title;
        body.court = selectedCase.court || "District Court";
      }

      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data.data);
      toast.success("Analysis complete!");
      refreshUsage();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to analyze case");
    } finally {
      setAnalyzing(false);
    }
  };

  const getStrengthLabel = (s: number) => s >= 70 ? "Strong" : s >= 40 ? "Moderate" : "Weak";
  const getStrengthColor = (s: number) => s >= 70 ? "bg-green-100 text-green-800" : s >= 40 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
  const getRiskColor = (r: string) => {
    switch (r) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-red-100 text-red-800";
      case "critical": return "bg-red-200 text-red-900";
      default: return "bg-[var(--border)] text-[var(--text-primary)]";
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const lines = [
      `CASE ANALYSIS REPORT`,
      `Generated: ${new Date().toLocaleDateString("en-IN")}`,
      ``,
      `Case: ${result.caseTitle}`,
      `Summary: ${result.summary}`,
      ``,
      `STRENGTH: ${result.strength}% (${getStrengthLabel(result.strength)})`,
      `RISK LEVEL: ${result.riskLevel}`,
      `ESTIMATED DURATION: ${result.estimatedDuration}`,
      `POTENTIAL OUTCOME: ${result.potentialOutcome}`,
      ``,
      `KEY ISSUES`,
      ...result.keyIssues.map((issue, i) => `  ${i + 1}. ${issue}`),
      ``,
      `RECOMMENDED STRATEGIES`,
      ...result.suggestedStrategies.map((s, i) => [
        `  ${i + 1}. ${s.title} (${s.probability}% success)`,
        `     ${s.description}`,
        s.estimatedCost ? `     Est. Cost: ${s.estimatedCost}` : "",
        s.benefits.length > 0 ? `     Benefits: ${s.benefits.join(", ")}` : "",
      ].filter(Boolean).join("\n")),
      ``,
      `NEXT STEPS`,
      ...result.nextSteps.map((step, i) => `  ${i + 1}. ${step}`),
      ``,
      `RELEVANT PRECEDENTS`,
      ...result.relevantPrecedents.map((p, i) => [
        `  ${i + 1}. ${p.caseName}`,
        `     ${p.citation} - ${p.court} (${p.year})`,
        `     ${p.summary}`,
      ].join("\n")),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Analysis copied to clipboard!");
  };

  const exportPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("AI Case Analysis Report", 15, 15);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")} | CaseFiles`, 15, 23);

    y = 40;
    doc.setTextColor(0, 0, 0);

    // Case title
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(result.caseTitle, 15, y);
    y += 8;

    // Summary
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const summaryLines = doc.splitTextToSize(result.summary, pageWidth - 30);
    doc.text(summaryLines, 15, y);
    y += summaryLines.length * 5 + 6;

    // Stats
    doc.setFillColor(245, 245, 245);
    doc.rect(15, y - 3, pageWidth - 30, 12, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`Strength: ${result.strength}% (${getStrengthLabel(result.strength)})`, 20, y + 3);
    doc.text(`Risk: ${result.riskLevel}`, 80, y + 3);
    doc.text(`Duration: ${result.estimatedDuration}`, 120, y + 3);
    y += 18;

    // Key Issues
    if (result.keyIssues.length > 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(200, 100, 0);
      doc.text("KEY ISSUES", 15, y);
      y += 6;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      for (const issue of result.keyIssues) {
        const lines = doc.splitTextToSize(`• ${issue}`, pageWidth - 35);
        doc.text(lines, 20, y);
        y += lines.length * 4 + 2;
      }
      y += 4;
    }

    // Strategies
    if (result.suggestedStrategies.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(200, 150, 0);
      doc.text("RECOMMENDED STRATEGIES", 15, y);
      y += 6;
      for (const s of result.suggestedStrategies) {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`${s.title} (${s.probability}% success)`, 20, y);
        y += 5;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        const descLines = doc.splitTextToSize(s.description, pageWidth - 40);
        doc.text(descLines, 20, y);
        y += descLines.length * 4 + 4;
      }
      y += 4;
    }

    // Next Steps
    if (result.nextSteps.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text("NEXT STEPS", 15, y);
      y += 6;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      for (let i = 0; i < result.nextSteps.length; i++) {
        const lines = doc.splitTextToSize(`${i + 1}. ${result.nextSteps[i]}`, pageWidth - 40);
        doc.text(lines, 20, y);
        y += lines.length * 4 + 2;
      }
      y += 4;
    }

    // Precedents
    if (result.relevantPrecedents.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(128, 0, 128);
      doc.text("RELEVANT PRECEDENTS", 15, y);
      y += 6;
      for (const p of result.relevantPrecedents) {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(p.caseName, 20, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`${p.citation} - ${p.court} (${p.year})`, 20, y);
        y += 4;
        const sumLines = doc.splitTextToSize(p.summary, pageWidth - 40);
        doc.text(sumLines, 20, y);
        y += sumLines.length * 4 + 4;
      }
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`CaseFiles AI Analysis | Page ${i}/${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
    }

    doc.save(`case-analysis-${result.caseTitle.replace(/[^a-zA-Z0-9]/g, "-").substring(0, 30)}-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF downloaded!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          AI Case Analysis
        </h1>
        <p className="text-[var(--text-secondary)]">Get AI-powered insights on your case strength and strategy</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Describe Your Case</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cases.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Select Existing Case</label>
              <select
                value={selectedCaseId}
                onChange={(e) => handleCaseSelect(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">-- Other (describe manually) --</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}{c.client ? ` — ${c.client.full_name}` : ""} ({c.status})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Case Type</label>
            <select
              value={caseType}
              onChange={(e) => setCaseType(e.target.value)}
              disabled={!!selectedCaseId}
              className={`w-full px-3 py-2 border rounded-md text-sm ${selectedCaseId ? "bg-[var(--border)] cursor-not-allowed" : ""}`}
            >
              <option value="civil">Civil</option>
              <option value="criminal">Criminal</option>
              <option value="family">Family</option>
              <option value="corporate">Corporate</option>
              <option value="property">Property</option>
              <option value="labor">Labor</option>
              <option value="consumer">Consumer</option>
              <option value="constitutional">Constitutional</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Case Facts & Description *</label>
            <textarea
              placeholder={selectedCase ? "Case details auto-filled from your selection. Edit if needed..." : "Describe the facts of your case, the legal issues involved, and what outcome you're seeking..."}
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={6}
            />
          </div>
          <Button onClick={handleAnalyze} disabled={analyzing || isAtLimit} className="w-full">
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Case...
              </>
            ) : isAtLimit ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Limit Reached
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyze Case
              </>
            )}
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

      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-[var(--text-primary)]">{result.summary}</p>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Strength</p>
                    <p className="text-xl font-bold">{result.strength}%</p>
                  </div>
                  <Badge className={getStrengthColor(result.strength)}>
                    {getStrengthLabel(result.strength)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Risk Level</p>
                    <p className="text-xl font-bold capitalize">{result.riskLevel}</p>
                  </div>
                  <Badge className={getRiskColor(result.riskLevel)}>
                    {result.riskLevel}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-[var(--text-secondary)]">Duration</p>
                <p className="text-xl font-bold">{result.estimatedDuration}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-[var(--text-secondary)]">Outcome</p>
                <p className="text-sm font-bold">{result.potentialOutcome}</p>
              </CardContent>
            </Card>
          </div>

          {/* Key Issues */}
          {result.keyIssues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Key Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.keyIssues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{issue}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strategies */}
          {result.suggestedStrategies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Recommended Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.suggestedStrategies.map((strategy, i) => (
                    <div key={i} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{strategy.title}</h4>
                        <Badge variant="outline">{strategy.probability}% success</Badge>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mb-2">{strategy.description}</p>
                      {strategy.estimatedCost && (
                        <p className="text-xs text-[var(--text-secondary)]">Est. Cost: {strategy.estimatedCost}</p>
                      )}
                      {strategy.benefits.length > 0 && (
                        <div className="mt-2">
                          {strategy.benefits.map((b, j) => (
                            <span key={j} className="inline-block text-xs bg-green-50 text-green-700 rounded px-2 py-0.5 mr-1 mb-1">{b}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          {result.nextSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-[var(--text-accent)]" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.nextSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-[var(--surface-subtle)]">
                      <span className="w-5 h-5 rounded-full bg-[var(--text-accent)] text-white text-xs flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Precedents */}
          {result.relevantPrecedents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Relevant Precedents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.relevantPrecedents.map((prec, i) => (
                    <div key={i} className="p-3 rounded border hover:bg-[var(--surface-subtle)]">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{prec.caseName}</h4>
                        <Badge variant="outline">{prec.relevance}%</Badge>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{prec.citation} - {prec.court} ({prec.year})</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-2">{prec.summary}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Actions */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <Button variant="outline" onClick={copyToClipboard} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy Analysis
            </Button>
            <Button variant="outline" onClick={exportPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
