"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Receipt, IndianRupee } from "lucide-react";
import Link from "next/link";
import { calculateCourtFee, caseTypesForFee, courtLevels } from "@/lib/india/court-fees";
import { formatCurrency } from "@/lib/utils";

export default function CourtFeeCalculatorPage() {
  const [caseType, setCaseType] = useState("civil");
  const [courtLevel, setCourtLevel] = useState("district");
  const [claimAmount, setClaimAmount] = useState("");
  const [courtFee, setCourtFee] = useState<number | null>(null);

  const calculate = () => {
    if (!claimAmount) return;
    const amount = parseFloat(claimAmount);
    if (isNaN(amount)) return;

    const fee = calculateCourtFee(caseType, amount);
    setCourtFee(fee);
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
          <h1 className="text-2xl font-bold">Court Fee Calculator</h1>
          <p className="text-gray-500">Calculate court fees as per the Court Fees Act, 1870</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calculate Court Fee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Case Type</label>
              <Select
                options={caseTypesForFee.map((t) => ({ value: t.value, label: t.label }))}
                value={caseType}
                onChange={(e) => setCaseType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Court Level</label>
              <Select
                options={courtLevels.map((c) => ({ value: c.value, label: c.label }))}
                value={courtLevel}
                onChange={(e) => setCourtLevel(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Claim Amount (INR)</label>
            <Input
              type="number"
              placeholder="Enter claim amount"
              value={claimAmount}
              onChange={(e) => setClaimAmount(e.target.value)}
            />
          </div>

          <Button onClick={calculate} disabled={!claimAmount} className="w-full">
            Calculate Court Fee
          </Button>
        </CardContent>
      </Card>

      {courtFee !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Case Type</p>
                <p className="font-medium capitalize">{caseType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Court Level</p>
                <p className="font-medium capitalize">{courtLevel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Claim Amount</p>
                <p className="font-medium">{formatCurrency(parseFloat(claimAmount))}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Court Fee</p>
                <p className="font-medium text-lg text-blue-600">{formatCurrency(courtFee)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <IndianRupee className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Court Fee: {formatCurrency(courtFee)}</p>
                  <p className="text-sm text-blue-600">
                    This is the approximate court fee. Actual fees may vary based on specific court rules.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Court Fee Slabs (Civil Suits)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
              <div>Claim Amount</div>
              <div>Fee</div>
              <div>Type</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm py-2 border-b">
              <div>Up to ₹10,000</div>
              <div>₹500</div>
              <div>Fixed</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm py-2 border-b">
              <div>₹10,001 - ₹50,000</div>
              <div>₹1,000</div>
              <div>Fixed</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm py-2 border-b">
              <div>₹50,001 - ₹1,00,000</div>
              <div>₹2,000</div>
              <div>Fixed</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm py-2 border-b">
              <div>₹1,00,001 - ₹5,00,000</div>
              <div>₹4,000</div>
              <div>Fixed</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm py-2 border-b">
              <div>₹5,00,001 - ₹10,00,000</div>
              <div>₹8,000</div>
              <div>Fixed</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm py-2 border-b">
              <div>₹10,00,001 - ₹50,00,000</div>
              <div>₹15,000</div>
              <div>Fixed</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm py-2">
              <div>Above ₹50,00,000</div>
              <div>0.5%</div>
              <div>Percentage</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
