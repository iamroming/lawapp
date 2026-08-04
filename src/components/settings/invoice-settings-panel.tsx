"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { createClient } from "@/lib/supabase/client";
import { Building, Receipt, Settings } from "lucide-react";
import toast from "react-hot-toast";

export interface InvoiceSettings {
  show_firm_name: boolean;
  show_firm_address: boolean;
  show_firm_phone: boolean;
  show_firm_email: boolean;
  show_firm_gstin: boolean;
  show_bank_details: boolean;
  show_upi: boolean;
  show_client_company: boolean;
  show_client_gstin: boolean;
  show_case_details: boolean;
  show_due_date: boolean;
  show_hsn_code: boolean;
  show_gst_breakdown: boolean;
  show_reverse_charge: boolean;
  show_place_of_supply: boolean;
  show_terms: boolean;
  show_payment_instructions: boolean;
  show_footer_notes: boolean;
  footer_notes: string;
  terms_and_conditions: string;
}

const DEFAULT_SETTINGS: InvoiceSettings = {
  show_firm_name: true, show_firm_address: true, show_firm_phone: true, show_firm_email: true,
  show_firm_gstin: true, show_bank_details: true, show_upi: true, show_client_company: true,
  show_client_gstin: true, show_case_details: true, show_due_date: true, show_hsn_code: true,
  show_gst_breakdown: true, show_reverse_charge: true, show_place_of_supply: true,
  show_terms: true, show_payment_instructions: true, show_footer_notes: true,
  footer_notes: "", terms_and_conditions: "Payment due within 30 days. Late payments attract 1.5% monthly interest.",
};

export function InvoiceSettingsPanel() {
  const [saving, setSaving] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [settings, setSettings] = useState<InvoiceSettings>(DEFAULT_SETTINGS);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("bank_name, bank_account, bank_ifsc, upi_id, invoice_settings").eq("id", user.id).single();
      if (data) {
        if (data.bank_name) setBankName(data.bank_name);
        if (data.bank_account) setBankAccount(data.bank_account);
        if (data.bank_ifsc) setBankIfsc(data.bank_ifsc);
        if (data.upi_id) setUpiId(data.upi_id);
        if (data.invoice_settings) setSettings({ ...DEFAULT_SETTINGS, ...data.invoice_settings });
      }
    })();
  }, []);

  const toggle = (key: keyof InvoiceSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("profiles").update({
        bank_name: bankName || null,
        bank_account: bankAccount || null,
        bank_ifsc: bankIfsc || null,
        upi_id: upiId || null,
        invoice_settings: settings,
      }).eq("id", user.id);
      if (error) toast.error(error.message);
      else toast.success("Invoice settings saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Firm Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Firm Details
          </CardTitle>
          <p className="text-sm text-[var(--text-secondary)]">Show or hide your firm information on invoices</p>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          <ToggleRow label="Firm Name" sub="Display your firm name in the header" checked={settings.show_firm_name} onChange={() => toggle("show_firm_name")} />
          <ToggleRow label="Firm Address" sub="Show registered office address" checked={settings.show_firm_address} onChange={() => toggle("show_firm_address")} />
          <ToggleRow label="Phone Number" sub="Show contact phone" checked={settings.show_firm_phone} onChange={() => toggle("show_firm_phone")} />
          <ToggleRow label="Email Address" sub="Show firm email" checked={settings.show_firm_email} onChange={() => toggle("show_firm_email")} />
          <ToggleRow label="GSTIN / PAN" sub="Show GST identification number" checked={settings.show_firm_gstin} onChange={() => toggle("show_firm_gstin")} />
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Bank & Payment Details
          </CardTitle>
          <p className="text-sm text-[var(--text-secondary)]">Configure payment information shown on invoices</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-0 divide-y">
            <ToggleRow label="Bank Details" sub="Show bank name, account number, IFSC" checked={settings.show_bank_details} onChange={() => toggle("show_bank_details")} />
            <ToggleRow label="UPI ID" sub="Show UPI payment option" checked={settings.show_upi} onChange={() => toggle("show_upi")} />
          </div>
          {settings.show_bank_details && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium mb-1">Bank Name</label>
                <Input placeholder="e.g. State Bank of India" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Account Number</label>
                <Input placeholder="Account number" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">IFSC Code</label>
                <Input placeholder="e.g. SBIN0001234" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">UPI ID</label>
                <Input placeholder="e.g. firm@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client & Case */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Client & Case Details
          </CardTitle>
          <p className="text-sm text-[var(--text-secondary)]">Control what client and case info appears</p>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          <ToggleRow label="Client Company Name" sub="Show company name (if available)" checked={settings.show_client_company} onChange={() => toggle("show_client_company")} />
          <ToggleRow label="Client GSTIN" sub="Show client's GST number" checked={settings.show_client_gstin} onChange={() => toggle("show_client_gstin")} />
          <ToggleRow label="Case Reference" sub="Show case title and number" checked={settings.show_case_details} onChange={() => toggle("show_case_details")} />
        </CardContent>
      </Card>

      {/* GST & Tax */}
      <Card>
        <CardHeader>
          <CardTitle>GST & Tax</CardTitle>
          <p className="text-sm text-[var(--text-secondary)]">Configure tax-related fields</p>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          <ToggleRow label="HSN / SAC Code" sub="Show HSN or SAC code column" checked={settings.show_hsn_code} onChange={() => toggle("show_hsn_code")} />
          <ToggleRow label="GST Breakdown" sub="Show CGST/SGST/IGST split" checked={settings.show_gst_breakdown} onChange={() => toggle("show_gst_breakdown")} />
          <ToggleRow label="Reverse Charge" sub="Show reverse charge indicator" checked={settings.show_reverse_charge} onChange={() => toggle("show_reverse_charge")} />
          <ToggleRow label="Place of Supply" sub="Show state/place of supply" checked={settings.show_place_of_supply} onChange={() => toggle("show_place_of_supply")} />
        </CardContent>
      </Card>

      {/* Footer & Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Footer & Terms</CardTitle>
          <p className="text-sm text-[var(--text-secondary)]">Customize invoice footer content</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-0 divide-y">
            <ToggleRow label="Terms & Conditions" sub="Show T&C section at bottom" checked={settings.show_terms} onChange={() => toggle("show_terms")} />
            <ToggleRow label="Payment Instructions" sub="Show bank/UPI payment details at bottom" checked={settings.show_payment_instructions} onChange={() => toggle("show_payment_instructions")} />
            <ToggleRow label="Footer Notes" sub="Show custom footer text" checked={settings.show_footer_notes} onChange={() => toggle("show_footer_notes")} />
          </div>
          {settings.show_terms && (
            <div className="pt-2">
              <label className="block text-sm font-medium mb-1">Terms & Conditions Text</label>
              <Textarea rows={3} value={settings.terms_and_conditions} onChange={(e) => setSettings((p) => ({ ...p, terms_and_conditions: e.target.value }))} placeholder="Payment due within 30 days..." />
            </div>
          )}
          {settings.show_footer_notes && (
            <div className="pt-2">
              <label className="block text-sm font-medium mb-1">Footer Notes</label>
              <Textarea rows={2} value={settings.footer_notes} onChange={(e) => setSettings((p) => ({ ...p, footer_notes: e.target.value }))} placeholder="Thank you for your business..." />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="px-8">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-sm text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
