"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Percent, Save, AlertCircle } from "lucide-react";

interface ProfitShare {
  role: string;
  profit_percentage: number;
}

const ROLES = [
  { value: "partner", label: "Partner" },
  { value: "senior_associate", label: "Senior Associate" },
  { value: "associate", label: "Associate" },
  { value: "junior_associate", label: "Junior Associate" },
  { value: "paralegal", label: "Paralegal" },
  { value: "intern", label: "Intern" },
  { value: "office_admin", label: "Office Admin" },
];

export default function ProfitSharingPage() {
  const [profitShares, setProfitShares] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firmId, setFirmId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id, role")
        .eq("id", user.id)
        .single();

      const fid = profile?.firm_id;
      const owner = profile?.role === "owner";
      setFirmId(fid);
      setIsOwner(owner);

      if (fid) {
        await fetchProfitShares(fid);
      }
    };
    init();
  }, [supabase]);

  const fetchProfitShares = async (fid: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("firm_profit_sharing")
      .select("role, profit_percentage")
      .eq("firm_id", fid);

    const shares: Record<string, number> = {};
    ROLES.forEach((r) => { shares[r.value] = 0; });
    (data || []).forEach((item: ProfitShare) => {
      shares[item.role] = item.profit_percentage;
    });

    setProfitShares(shares);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!firmId) return;
    setSaving(true);
    setMessage(null);

    for (const [role, percentage] of Object.entries(profitShares)) {
      const { error } = await supabase
        .from("firm_profit_sharing")
        .upsert(
          { firm_id: firmId, role, profit_percentage: percentage },
          { onConflict: "firm_id,role" }
        );

      if (error) {
        setMessage({ type: "error", text: `Error saving ${role}: ${error.message}` });
        setSaving(false);
        return;
      }
    }

    setMessage({ type: "success", text: "Profit sharing settings saved!" });
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const totalPercentage = Object.values(profitShares).reduce((sum, v) => sum + v, 0);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading profit sharing settings...</div>;
  }

  if (!isOwner) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-500">Only firm owners can manage profit sharing settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profit Sharing</h1>
        <p className="text-gray-500">Configure profit share percentages for each role in your firm</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Role Profit Shares</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={totalPercentage <= 100 ? "default" : "destructive"}>
                Total: {totalPercentage.toFixed(1)}%
              </Badge>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ROLES.map((role) => (
              <div key={role.value} className="flex items-center gap-4 p-4 rounded-lg border">
                <div className="flex-1">
                  <span className="font-medium">{role.label}</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Percentage of firm profit shared with {role.label.toLowerCase()}s
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={profitShares[role.value] || 0}
                    onChange={(e) =>
                      setProfitShares({
                        ...profitShares,
                        [role.value]: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 text-right"
                  />
                  <Percent className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Profit Share:</span>
              <Badge variant={totalPercentage <= 100 ? "default" : "destructive"}>
                {totalPercentage.toFixed(1)}% / 100%
              </Badge>
            </div>
            {totalPercentage > 100 && (
              <p className="text-sm text-red-600 mt-2">
                Warning: Total profit share exceeds 100%. Please adjust the percentages.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
