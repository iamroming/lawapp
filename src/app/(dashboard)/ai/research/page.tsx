"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, FileText, Scale, Bookmark } from "lucide-react";
import { searchLegalResearch } from "@/lib/ai/service";
import type { ResearchResult } from "@/lib/ai/types";
import toast from "react-hot-toast";

const legalTopics = [
  { value: "", label: "All Topics" },
  { value: "criminal", label: "Criminal Law" },
  { value: "civil", label: "Civil Law" },
  { value: "family", label: "Family Law" },
  { value: "corporate", label: "Corporate Law" },
  { value: "property", label: "Property Law" },
  { value: "constitutional", label: "Constitutional Law" },
  { value: "tax", label: "Tax Law" },
  { value: "labor", label: "Labor Law" },
];

const typeIcons: Record<string, React.ReactNode> = {
  section: <FileText className="h-5 w-5 text-blue-500" />,
  case_law: <Scale className="h-5 w-5 text-purple-500" />,
  opinion: <BookOpen className="h-5 w-5 text-green-500" />,
  article: <FileText className="h-5 w-5 text-orange-500" />,
};

export default function AIResearchPage() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setLoading(true);
    try {
      const searchResults = await searchLegalResearch(query, topic || undefined);
      setResults(searchResults);
      toast.success(`Found ${searchResults.length} results`);
    } catch (error) {
      toast.error("Search failed. Please try again.");
    }
    setLoading(false);
  };

  const handleSaveNote = (resultId: string) => {
    if (!savedNotes.includes(resultId)) {
      setSavedNotes((prev) => [...prev, resultId]);
      toast.success("Research saved to notes!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Search className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Legal Research Assistant</h1>
          <p className="text-gray-500">Search legal provisions, case law, and more</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search for legal provisions, case law, sections..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={legalTopics}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <Search className="h-4 w-4 animate-pulse" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {results.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Search Legal Database</h3>
                  <p className="text-gray-500 mt-1">
                    Enter your query to search across Indian legal provisions, case law, and legal articles.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            results.map((result) => (
              <Card key={result.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {typeIcons[result.type] || <FileText className="h-5 w-5 text-gray-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{result.title}</h3>
                        <Badge variant="outline" className="capitalize">
                          {result.type.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                      <p className="text-xs text-gray-400">Source: {result.source}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{result.relevance}%</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveNote(result.id)}
                        disabled={savedNotes.includes(result.id)}
                      >
                        <Bookmark className={`h-4 w-4 ${savedNotes.includes(result.id) ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Indian Penal Code",
                "Code of Civil Procedure",
                "Code of Criminal Procedure",
                "Indian Evidence Act",
                "Contract Act",
                "Transfer of Property Act",
              ].map((act) => (
                <button
                  key={act}
                  onClick={() => setQuery(act)}
                  className="block w-full text-left text-sm text-blue-600 hover:underline py-1"
                >
                  {act}
                </button>
              ))}
            </CardContent>
          </Card>

          {savedNotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Saved Research ({savedNotes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {savedNotes.length} items saved to your research notes.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
