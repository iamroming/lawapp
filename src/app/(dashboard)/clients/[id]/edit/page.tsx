"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh", "Puducherry",
  "Andaman and Nicobar Islands", "Dadra and Nagar Haveli", "Lakshadweep",
];

interface ClientData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  alternate_phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  company_name: string;
  gst_number: string;
  notes: string;
}

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    alternate_phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    company_name: "",
    gst_number: "",
    notes: "",
  });
  const supabase = createClient();

  useEffect(() => {
    const fetchClient = async () => {
      const { data } = await supabase.from("clients").select("*").eq("id", params.id).single();
      if (data) {
        const c = data as ClientData;
        setFormData({
          full_name: c.full_name,
          email: c.email || "",
          phone: c.phone,
          alternate_phone: c.alternate_phone || "",
          address: c.address || "",
          city: c.city || "",
          state: c.state || "",
          pincode: c.pincode || "",
          company_name: c.company_name || "",
          gst_number: c.gst_number || "",
          notes: c.notes || "",
        });
      }
      setFetching(false);
    };
    fetchClient();
  }, [params.id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.full_name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      setLoading(false);
      return;
    }

    const phoneClean = formData.phone.replace(/[\s\-+]/g, "");
    if (phoneClean.length < 10 || phoneClean.length > 13) {
      toast.error("Please enter a valid phone number");
      setLoading(false);
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (formData.alternate_phone) {
      const altClean = formData.alternate_phone.replace(/[\s\-+]/g, "");
      if (altClean.length < 10 || altClean.length > 13) {
        toast.error("Please enter a valid alternate phone number");
        setLoading(false);
        return;
      }
    }

    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      toast.error("Pincode must be exactly 6 digits");
      setLoading(false);
      return;
    }

    if (formData.gst_number && formData.gst_number.length !== 15) {
      toast.error("GST number must be 15 characters");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("clients")
      .update({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        alternate_phone: formData.alternate_phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        company_name: formData.company_name,
        gst_number: formData.gst_number,
        notes: formData.notes,
      })
      .eq("id", params.id);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Client updated successfully!");
    router.push(`/clients/${params.id}`);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (fetching) {
    return <div className="text-center py-12 text-gray-500">Loading client...</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/clients/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Client</h1>
          <p className="text-gray-500">Update client details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name *</label>
              <Input
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone *</label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Alternate Phone</label>
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.alternate_phone}
                onChange={(e) => updateField("alternate_phone", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Textarea
                placeholder="Full address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Input
                  placeholder="Mumbai"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <Select
                  options={[
                    { value: "", label: "Select state" },
                    ...indianStates.map((s) => ({ value: s, label: s })),
                  ]}
                  value={formData.state}
                  onChange={(e) => updateField("state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pincode</label>
                <Input
                  placeholder="400001"
                  value={formData.pincode}
                  onChange={(e) => updateField("pincode", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Company Details (if applicable)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  placeholder="ABC Pvt. Ltd."
                  value={formData.company_name}
                  onChange={(e) => updateField("company_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">GST Number</label>
                <Input
                  placeholder="27AABCU9603R1ZM"
                  value={formData.gst_number}
                  onChange={(e) => updateField("gst_number", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any additional notes about this client..."
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Link href={`/clients/${params.id}`}>
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Client"}
          </Button>
        </div>
      </form>
    </div>
  );
}
