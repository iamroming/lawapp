"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSearch, Loader2, Copy, CheckCircle, AlertCircle, Lightbulb } from "lucide-react";
import toast from "react-hot-toast";

interface SummaryResult {
  title: string;
  summary: string;
  keyPoints: string[];
  legalIssues: string[];
  deadlines: string[];
  parties: string[];
  nextSteps: string[];
  strategies: string[];
}

export default function AISummarizePage() {
  const [documentText, setDocumentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    if (!documentText.trim() || documentText.trim().length < 20) {
      toast.error("Please enter at least 20 characters of document text");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Document Summary",
          description: documentText.trim(),
          case_type: "document_analysis",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Summarization failed");
      }

      const { data } = await res.json();
      setResult({
        title: "Document Summary",
        summary: data.summary || "",
        keyPoints: data.keyIssues || [],
        legalIssues: data.keyIssues || [],
        deadlines: [],
        parties: [],
        nextSteps: data.nextSteps || [],
        strategies: data.suggestedStrategies?.map((s: { title: string }) => s.title) || [],
      });
      toast.success("Document analyzed successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      const text = `SUMMARY\n${result.summary}\n\nKEY ISSUES\n${result.keyPoints.map((p) => `- ${p}`).join("\n")}\n\nNEXT STEPS\n${result.nextSteps.map((s) => `- ${s}`).join("\n")}\n\nSTRATEGIES\n${result.strategies.map((s) => `- ${s}`).join("\n")}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileSearch className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Document Summarizer</h1>
          <p className="text-gray-500">
            Analyze and summarize legal documents with AI
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paste Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your legal document text here for analysis..."
            rows={10}
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
          />
          <Button onClick={handleSummarize} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileSearch className="h-4 w-4 mr-2" />
            )}
            Analyze Document
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Summary</CardTitle>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {result.summary}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Key Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.keyPoints.length === 0 ? (
                  <p className="text-sm text-gray-500">No issues identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {result.keyPoints.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Badge variant="secondary" className="mt-0.5">
                          {i + 1}
                        </Badge>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.nextSteps.length === 0 ? (
                  <p className="text-sm text-gray-500">No next steps identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {result.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Badge variant="secondary" className="mt-0.5">
                          {i + 1}
                        </Badge>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {result.strategies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Suggested Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.strategies.map((strategy, i) => (
                    <Badge key={i} variant="outline">
                      {strategy}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!result && !loading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileSearch className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Paste a Document to Analyze
              </h3>
              <p className="text-gray-500 mt-1">
                Paste any legal document text and click Analyze to get a summary,
                key issues, and recommended next steps.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
