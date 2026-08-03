"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, MessageSquare, Bell, Smartphone } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Preferences {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
  hearingReminders: boolean;
  paymentAlerts: boolean;
  caseUpdates: boolean;
  documentAlerts: boolean;
}

const defaultPreferences: Preferences = {
  email: true,
  sms: false,
  whatsapp: false,
  push: true,
  hearingReminders: true,
  paymentAlerts: true,
  caseUpdates: true,
  documentAlerts: true,
};

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("notification_preferences")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (error && error.code !== "PGRST116") {
            console.error("Error fetching preferences:", error);
          }

          if (data) {
            setPreferences({
              email: data.email ?? true,
              sms: data.sms ?? false,
              whatsapp: data.whatsapp ?? false,
              push: data.push ?? true,
              hearingReminders: data.hearing_reminders ?? true,
              paymentAlerts: data.payment_alerts ?? true,
              caseUpdates: data.case_updates ?? true,
              documentAlerts: data.document_alerts ?? true,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load preferences:", err);
      }
      setLoading(false);
    };
    fetchPreferences();
  }, [supabase]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("notification_preferences").upsert({
        user_id: user.id,
        email: preferences.email,
        sms: preferences.sms,
        whatsapp: preferences.whatsapp,
        push: preferences.push,
        hearing_reminders: preferences.hearingReminders,
        payment_alerts: preferences.paymentAlerts,
        case_updates: preferences.caseUpdates,
        document_alerts: preferences.documentAlerts,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Preferences saved!");
      }
    }
    setSaving(false);
  };

  const togglePreference = (key: keyof Preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="text-center py-12 text-gray-500">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/notifications">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Notification Preferences</h1>
          <p className="text-gray-500">Choose how you want to be notified</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "email" as const, label: "Email", description: "Receive notifications via email", icon: Mail },
            { key: "sms" as const, label: "SMS", description: "Receive notifications via SMS", icon: Smartphone },
            { key: "whatsapp" as const, label: "WhatsApp", description: "Receive notifications via WhatsApp", icon: MessageSquare },
            { key: "push" as const, label: "Push Notifications", description: "Receive browser push notifications", icon: Bell },
          ].map(({ key, label, description, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
              </div>
              <button
                onClick={() => togglePreference(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences[key] ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences[key] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "hearingReminders" as const, label: "Hearing Reminders", description: "Get reminded before upcoming hearings" },
            { key: "paymentAlerts" as const, label: "Payment Alerts", description: "Notifications for due and received payments" },
            { key: "caseUpdates" as const, label: "Case Updates", description: "Updates on case status changes" },
            { key: "documentAlerts" as const, label: "Document Alerts", description: "Notifications when documents are uploaded" },
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
              <button
                onClick={() => togglePreference(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences[key] ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences[key] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
