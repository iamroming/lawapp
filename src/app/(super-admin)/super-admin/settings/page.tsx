"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, AlertTriangle, Database, Shield } from "lucide-react";
import toast from "react-hot-toast";

interface Setting {
  key: string;
  value: any;
  description: string;
}

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from("platform_settings").select("*").order("key");
    setSettings((data as Setting[]) || []);
    setLoading(false);
  };

  const updateSetting = async (key: string, value: any) => {
    setSettings((prev) => prev.map((s) => s.key === key ? { ...s, value } : s));
  };

  const saveAll = async () => {
    setSaving(true);
    for (const s of settings) {
      await supabase.from("platform_settings").update({ value: s.value }).eq("key", s.key);
    }
    toast.success("Settings saved!");
    setSaving(false);
  };

  const getBoolValue = (key: string) => {
    const s = settings.find((x) => x.key === key);
    if (!s) return false;
    if (typeof s.value === "boolean") return s.value;
    if (typeof s.value === "string") return s.value === "true";
    return false;
  };

  const getStringValue = (key: string) => {
    const s = settings.find((x) => x.key === key);
    if (!s) return "";
    if (typeof s.value === "string") return s.value.replace(/^"|"$/g, "");
    return String(s.value);
  };

  if (loading) return <div className="text-center py-12 text-[var(--text-secondary)]">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6 text-orange-500" />Platform Settings</h1>
          <p className="text-[var(--text-secondary)]">Configure the entire platform</p>
        </div>
        <Button onClick={saveAll} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">App Name</label>
              <Input value={getStringValue("app_name")} onChange={(e) => updateSetting("app_name", `"${e.target.value}"`)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Support Email</label>
              <Input value={getStringValue("support_email")} onChange={(e) => updateSetting("support_email", `"${e.target.value}"`)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Trial Days</label>
              <Input type="number" value={getStringValue("default_trial_days")} onChange={(e) => updateSetting("default_trial_days", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Upload Size (MB)</label>
              <Input type="number" value={getStringValue("max_upload_size_mb")} onChange={(e) => updateSetting("max_upload_size_mb", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Access Control</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Maintenance Mode</p>
                <p className="text-xs text-[var(--text-secondary)]">Block all access except super admin</p>
              </div>
              <button
                onClick={() => updateSetting("maintenance_mode", !getBoolValue("maintenance_mode"))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${getBoolValue("maintenance_mode") ? "bg-red-600" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${getBoolValue("maintenance_mode") ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Allow Signups</p>
                <p className="text-xs text-[var(--text-secondary)]">Allow new user registrations</p>
              </div>
              <button
                onClick={() => updateSetting("allow_signups", !getBoolValue("allow_signups"))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${getBoolValue("allow_signups") ? "bg-green-600" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${getBoolValue("allow_signups") ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />System Info</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-[var(--text-secondary)]">Platform</p><p className="font-medium">LawXP v0.1.0</p></div>
            <div><p className="text-[var(--text-secondary)]">Database</p><p className="font-medium">Supabase PostgreSQL</p></div>
            <div><p className="text-[var(--text-secondary)]">Framework</p><p className="font-medium">Next.js 16</p></div>
            <div><p className="text-[var(--text-secondary)]">Region</p><p className="font-medium">India (IN)</p></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Super Admin Notice</p>
              <p className="text-sm text-yellow-700 mt-1">
                You have full access to all platform data. Changes to settings affect all users immediately.
                Use maintenance mode carefully - it blocks access for all users except super admins.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
