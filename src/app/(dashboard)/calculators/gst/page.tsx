"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calculator, IndianRupee } from "lucide-react";
import Link from "next/link";
import { gstRates, calculateGST, formatNumberToWords } from "@/lib/india/gst";
import { formatCurrency } from "@/lib/utils";

export default function GSTCalculatorPage() {
  const [baseAmount, setBaseAmount] = useState("");
  const [gstRate, setGstRate] = useState("18");
  const [isInterState, setIsInterState] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateGST> | null>(null);

  const calculate = () => {
    if (!baseAmount) return;
    const amount = parseFloat(baseAmount);
    if (isNaN(amount)) return;

    const gstResult = calculateGST(amount, parseFloat(gstRate), isInterState);
    setResult(gstResult);
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
          <h1 className="text-2xl font-bold">GST Calculator</h1>
          <p className="text-gray-500">Calculate GST (CGST, SGST, IGST) on goods and services</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calculate GST</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Base Amount (INR)</label>
            <Input
              type="number"
              placeholder="Enter base amount"
              value={baseAmount}
              onChange={(e) => setBaseAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">GST Rate</label>
            <Select
              options={gstRates.map((r) => ({ value: r.value, label: r.label }))}
              value={gstRate}
              onChange={(e) => setGstRate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Supply Type</label>
            <Select
              options={[
                { value: "false", label: "Intra-State (CGST + SGST)" },
                { value: "true", label: "Inter-State (IGST)" },
              ]}
              value={String(isInterState)}
              onChange={(e) => setIsInterState(e.target.value === "true")}
            />
          </div>

          <Button onClick={calculate} disabled={!baseAmount} className="w-full">
            Calculate GST
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Base Amount</p>
                <p className="font-medium">{formatCurrency(result.baseAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">GST Rate</p>
                <p className="font-medium">{result.gstRate}%</p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              {isInterState ? (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">IGST ({result.gstRate}%)</span>
                  <span className="font-medium">{formatCurrency(result.igst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">CGST ({result.gstRate / 2}%)</span>
                    <span className="font-medium">{formatCurrency(result.cgst)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">SGST ({result.gstRate / 2}%)</span>
                    <span className="font-medium">{formatCurrency(result.sgst)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-gray-600">Total GST</span>
                <span className="font-medium">{formatCurrency(result.totalGST)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="font-semibold">Total Amount</span>
                <span className="font-semibold text-lg text-blue-600">{formatCurrency(result.totalAmount)}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <IndianRupee className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Total: {formatCurrency(result.totalAmount)}</p>
                  <p className="text-sm text-blue-600">
                    Amount in words: {formatNumberToWords(result.totalAmount)} Rupees Only
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>GST Rate Slabs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
              <div>Rate</div>
              <div>Applicable For</div>
            </div>
            {[
              { rate: "0%", items: "Essential items (unbranded food grains, fresh vegetables)" },
              { rate: "5%", items: "Packaged food items, footwear under ₹1000, fuel" },
              { rate: "12%", items: "Processed food, computers, business class air tickets" },
              { rate: "18%", items: "Most goods and services, IT services, financial services" },
              { rate: "28%", items: "Luxury items, automobiles, tobacco, aerated drinks" },
            ].map((item) => (
              <div key={item.rate} className="grid grid-cols-2 gap-4 text-sm py-2 border-b">
                <div className="font-medium">{item.rate}</div>
                <div className="text-gray-600">{item.items}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
