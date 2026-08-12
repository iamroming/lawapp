"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function NewBranchPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
  });
  const [operatingHours, setOperatingHours] = useState<Record<string, { open: string; close: string }>>({});
  const [enabledDays, setEnabledDays] = useState<Record<string, boolean>>({
    mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false,
  });

  const handleDayToggle = (day: string) => {
    setEnabledDays((prev) => ({ ...prev, [day]: !prev[day] }));
    if (!enabledDays[day]) {
      setOperatingHours((prev) => ({
        ...prev,
        [day]: { open: "09:00", close: "18:00" },
      }));
    } else {
      setOperatingHours((prev) => {
        const next = { ...prev };
        delete next[day];
        return next;
      });
    }
  };

  const handleTimeChange = (day: string, field: "open" | "close", value: string) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Branch name is required");
      return;
    }
    setSaving(true);

    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          operating_hours: operatingHours,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create branch");
        setSaving(false);
        return;
      }
      toast.success("Branch created successfully");
      router.push("/admin/branches");
    } catch {
      toast.error("Network error. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/branches">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Branch</h1>
          <p className="text-[var(--text-secondary)]">Add a new branch office for your firm</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Branch Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Branch Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Mumbai Office"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Full address"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Mumbai"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="Maharashtra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pincode</label>
                <Input
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="400001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="mumbai@firm.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Operating Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {DAYS.map((day, i) => (
              <div key={day} className="flex items-center gap-4">
                <label className="flex items-center gap-2 w-32">
                  <input
                    type="checkbox"
                    checked={enabledDays[day]}
                    onChange={() => handleDayToggle(day)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">{DAY_LABELS[i]}</span>
                </label>
                {enabledDays[day] && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={operatingHours[day]?.open || "09:00"}
                      onChange={(e) => handleTimeChange(day, "open", e.target.value)}
                      className="w-32"
                    />
                    <span className="text-[var(--text-secondary)]">to</span>
                    <Input
                      type="time"
                      value={operatingHours[day]?.close || "18:00"}
                      onChange={(e) => handleTimeChange(day, "close", e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Creating..." : "Create Branch"}
          </Button>
        </div>
      </form>
    </div>
  );
}
