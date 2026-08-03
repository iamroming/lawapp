"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Stamp, Receipt, Calculator } from "lucide-react";

const calculators = [
  {
    title: "Limitation Period Calculator",
    description: "Calculate limitation periods under the Indian Limitation Act, 1963",
    href: "/calculators/limitation",
    icon: Clock,
    color: "text-blue-600",
    bgColor: "bg-[var(--surface-subtle)]",
  },
  {
    title: "Court Fee Calculator",
    description: "Calculate court fees as per the Court Fees Act, 1870",
    href: "/calculators/court-fees",
    icon: Receipt,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "Stamp Duty Calculator",
    description: "Calculate stamp duty as per Indian Stamp Act, 1899",
    href: "/calculators/stamp-duty",
    icon: Stamp,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "GST Calculator",
    description: "Calculate GST (CGST, SGST, IGST) on goods and services",
    href: "/calculators/gst",
    icon: Calculator,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
];

export default function CalculatorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Legal Calculators</h1>
        <p className="text-[var(--text-secondary)]">India-specific legal calculators for lawyers and law firms</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {calculators.map((calc) => (
          <Link key={calc.href} href={calc.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${calc.bgColor}`}>
                    <calc.icon className={`h-6 w-6 ${calc.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{calc.title}</h3>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">{calc.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
