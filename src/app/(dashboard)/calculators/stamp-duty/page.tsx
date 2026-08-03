"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Stamp, IndianRupee } from "lucide-react";
import Link from "next/link";
import { documentTypes, calculateStampDuty } from "@/lib/india/stamp-duty";
import { indianStatesAndUTs } from "@/lib/india/states";
import { formatCurrency } from "@/lib/utils";

export default function StampDutyCalculatorPage() {
  const [documentType, setDocumentType] = useState("saleDeed");
  const [state, setState] = useState("Maharashtra");
  const [propertyValue, setPropertyValue] = useState("");
  const [result, setResult] = useState<{
    stampDuty: number;
    registrationFee: number;
    total: number;
  } | null>(null);

  const calculate = () => {
    if (!propertyValue) return;
    const value = parseFloat(propertyValue);
    if (isNaN(value)) return;

    const dutyResult = calculateStampDuty(documentType, state, value);
    setResult(dutyResult);
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
          <h1 className="text-2xl font-bold">Stamp Duty Calculator</h1>
          <p className="text-[var(--text-secondary)]">Calculate stamp duty as per Indian Stamp Act, 1899</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calculate Stamp Duty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <Select
                options={documentTypes.map((d) => ({ value: d.value, label: d.label }))}
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Select
                options={indianStatesAndUTs}
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Property / Document Value (INR)</label>
            <Input
              type="number"
              placeholder="Enter value"
              value={propertyValue}
              onChange={(e) => setPropertyValue(e.target.value)}
            />
          </div>

          <Button onClick={calculate} disabled={!propertyValue} className="w-full">
            Calculate Stamp Duty
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stamp className="h-5 w-5" />
              Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Document Type</p>
                <p className="font-medium">{documentTypes.find((d) => d.value === documentType)?.label}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">State</p>
                <p className="font-medium">{state}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Property Value</p>
                <p className="font-medium">{formatCurrency(parseFloat(propertyValue))}</p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Stamp Duty</span>
                <span className="font-medium">{formatCurrency(result.stampDuty)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Registration Fee</span>
                <span className="font-medium">{formatCurrency(result.registrationFee)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="font-semibold">Total Cost</span>
                <span className="font-semibold text-lg text-[var(--text-accent)]">{formatCurrency(result.total)}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-3 p-4 bg-[var(--surface-subtle)] rounded-lg">
                <IndianRupee className="h-5 w-5 text-[var(--text-accent)]" />
                <div>
                  <p className="font-medium text-blue-800">Total: {formatCurrency(result.total)}</p>
                  <p className="text-sm text-[var(--text-accent)]">
                    Stamp Duty: {formatCurrency(result.stampDuty)} + Registration: {formatCurrency(result.registrationFee)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Stamp Duty Rates by State (Sale Deed)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm font-medium text-[var(--text-secondary)] border-b pb-2">
              <div>State</div>
              <div>Rate</div>
            </div>
            {[
              { state: "Maharashtra", rate: "5%" },
              { state: "Delhi", rate: "4%" },
              { state: "Karnataka", rate: "5.6%" },
              { state: "Tamil Nadu", rate: "7%" },
              { state: "Uttar Pradesh", rate: "5%" },
              { state: "Gujarat", rate: "4.9%" },
              { state: "Rajasthan", rate: "5%" },
              { state: "West Bengal", rate: "5%" },
            ].map((item) => (
              <div key={item.state} className="grid grid-cols-2 gap-4 text-sm py-2 border-b">
                <div>{item.state}</div>
                <div>{item.rate}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
