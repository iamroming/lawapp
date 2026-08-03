"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { limitationArticles, calculateLimitationExpiry, calculateDaysRemaining, isExpired } from "@/lib/india/limitation";
import { formatDate } from "@/lib/utils";

export default function LimitationCalculatorPage() {
  const [selectedArticle, setSelectedArticle] = useState("");
  const [filingDate, setFilingDate] = useState("");
  const [result, setResult] = useState<{
    article: typeof limitationArticles[0];
    expiryDate: Date;
    daysRemaining: number;
    expired: boolean;
  } | null>(null);

  const calculate = () => {
    if (!selectedArticle || !filingDate) return;

    const article = limitationArticles.find((a) => a.id === selectedArticle);
    if (!article) return;

    const expiryDate = calculateLimitationExpiry(new Date(filingDate), article.period, article.periodUnit);
    const daysRemaining = calculateDaysRemaining(expiryDate);
    const expired = isExpired(expiryDate);

    setResult({ article, expiryDate, daysRemaining, expired });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/calculators">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Limitation Period Calculator</h1>
          <p className="text-[var(--text-secondary)]">Calculate limitation periods under the Indian Limitation Act, 1963</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calculate Limitation Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Article (Type of Suit)</label>
            <Select
              options={[
                { value: "", label: "Select article..." },
                ...limitationArticles.map((a) => ({ value: a.id, label: `${a.id} - ${a.description} (${a.period} ${a.periodUnit})` })),
              ]}
              value={selectedArticle}
              onChange={(e) => setSelectedArticle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date of Filing / Cause of Action</label>
            <Input
              type="date"
              value={filingDate}
              onChange={(e) => setFilingDate(e.target.value)}
            />
          </div>

          <Button onClick={calculate} disabled={!selectedArticle || !filingDate} className="w-full">
            Calculate Limitation
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Article</p>
                <p className="font-medium">{result.article.id} - {result.article.description}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Limitation Period</p>
                <p className="font-medium">{result.article.period} {result.article.periodUnit}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Date of Filing</p>
                <p className="font-medium">{formatDate(filingDate)}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Expiry Date</p>
                <p className="font-medium">{formatDate(result.expiryDate)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              {result.expired ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Limitation Expired</p>
                    <p className="text-sm text-red-600">
                      The limitation period expired on {formatDate(result.expiryDate)}. 
                      The suit is now time-barred.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Within Limitation</p>
                    <p className="text-sm text-green-600">
                      {result.daysRemaining} days remaining. 
                      File on or before {formatDate(result.expiryDate)}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Common Limitation Periods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {limitationArticles.slice(0, 10).map((article) => (
              <div key={article.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">Article {article.id}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{article.description}</p>
                </div>
                <Badge variant="outline">{article.period} {article.periodUnit}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
