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
} from "lucide-react";
import toast from "react-hot-toast";

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
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          AI Case Analysis
        </h1>
        <p className="text-gray-500">Get AI-powered insights on your case strength and strategy</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Describe Your Case</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cases.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Existing Case</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
            <select
              value={caseType}
              onChange={(e) => setCaseType(e.target.value)}
              disabled={!!selectedCaseId}
              className={`w-full px-3 py-2 border rounded-md text-sm ${selectedCaseId ? "bg-gray-100 cursor-not-allowed" : ""}`}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Case Facts & Description *</label>
            <textarea
              placeholder={selectedCase ? "Case details auto-filled from your selection. Edit if needed..." : "Describe the facts of your case, the legal issues involved, and what outcome you're seeking..."}
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={6}
            />
          </div>
          <Button onClick={handleAnalyze} disabled={analyzing} className="w-full">
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Case...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyze Case
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700">{result.summary}</p>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Strength</p>
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
                    <p className="text-sm text-gray-500">Risk Level</p>
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
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-xl font-bold">{result.estimatedDuration}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Outcome</p>
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
                      <p className="text-sm text-gray-600 mb-2">{strategy.description}</p>
                      {strategy.estimatedCost && (
                        <p className="text-xs text-gray-500">Est. Cost: {strategy.estimatedCost}</p>
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
                  <Scale className="h-5 w-5 text-blue-600" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.nextSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-blue-50">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0">
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
                    <div key={i} className="p-3 rounded border hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{prec.caseName}</h4>
                        <Badge variant="outline">{prec.relevance}%</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{prec.citation} - {prec.court} ({prec.year})</p>
                      <p className="text-xs text-gray-600 mt-2">{prec.summary}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
