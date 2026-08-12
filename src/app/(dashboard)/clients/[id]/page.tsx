"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dbWrite } from "@/lib/db-write";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate, getStatusColor } from "@/lib/utils";
import { ArrowLeft, Phone, Mail, MapPin, Building, Edit, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/use-user";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface ClientDetail {
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
  created_at: string;
}

interface ClientCase {
  id: string;
  case_number: string;
  title: string;
  status: string;
  created_at: string;
}

export default function ClientDetailPage() {
  const { user: appUser } = useUser();
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [cases, setCases] = useState<ClientCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchClient = async () => {
      if (!appUser) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id")
        .eq("id", appUser?.uuid)
        .single();

      if (!profile?.firm_id) {
        setLoading(false);
        return;
      }
      const firmId = profile.firm_id;

      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("id", params.id)
        .eq("firm_id", firmId)
        .is("deleted_at", null)
        .single();
      if (data) {
        setClient(data as ClientDetail);
        const { data: casesData } = await supabase
          .from("cases")
          .select("id, case_number, title, status, created_at")
          .eq("client_id", params.id)
          .eq("firm_id", firmId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });
        setCases(casesData || []);
      }
      setLoading(false);
    };
    fetchClient();
  }, [params.id, supabase]);

  const handleDelete = async () => {
    setDeleting(true);
    const now = new Date().toISOString();

    if (!appUser) { setDeleting(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id")
      .eq("id", appUser?.uuid)
      .single();

    if (!profile?.firm_id) {
      setDeleting(false);
      toast.error("No firm associated with your account");
      return;
    }
    const firmId = profile.firm_id;

    const caseIds = cases.map((c) => c.id);
    if (caseIds.length > 0) {
      await Promise.all(caseIds.map(async (caseId) => {
        await dbWrite("hearings", "update", { deleted_at: now }, { case_id: caseId, firm_id: firmId });
        await dbWrite("time_entries", "update", { deleted_at: now }, { case_id: caseId, firm_id: firmId });
        await dbWrite("documents", "update", { deleted_at: now }, { case_id: caseId, firm_id: firmId });
        await dbWrite("invoices", "update", { status: "cancelled" }, { case_id: caseId, firm_id: firmId });
      }));
    }
    await dbWrite("cases", "update", { deleted_at: now }, { client_id: params.id, firm_id: firmId });
    const { error } = await dbWrite("clients", "update", { deleted_at: now }, { id: params.id, firm_id: firmId });
    setDeleting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Client and all related records deleted");
    router.push("/clients");
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!client) return <div className="text-center py-12 text-gray-500">Client not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <Avatar name={client.full_name} size="lg" />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{client.full_name}</h1>
            {client.company_name && <p className="text-gray-500 text-sm truncate">{client.company_name}</p>}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link href={`/clients/${client.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`This will permanently delete this client and all ${cases.length} associated cases with their hearings, documents, and time entries. This action cannot be undone.`}
        confirmLabel="Delete Client"
        loading={deleting}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{client.phone}</span>
              </div>
              {client.alternate_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{client.alternate_phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{client.email}</span>
                </div>
              )}
              {(client.address || client.city) && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span>
                    {client.address}
                    {client.city && `, ${client.city}`}
                    {client.state && `, ${client.state}`}
                    {client.pincode && ` - ${client.pincode}`}
                  </span>
                </div>
              )}
              {client.company_name && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span>{client.company_name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cases */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cases ({cases.length})</CardTitle>
              <Link href={`/cases/new?client_id=${client.id}`}>
                <Button variant="outline" size="sm">New Case</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {cases.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No cases for this client yet.</p>
              ) : (
                <div className="space-y-3">
                  {cases.map((c) => (
                    <Link key={c.id} href={`/cases/${c.id}`}>
                      <div className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{c.title}</p>
                            <p className="text-xs text-gray-500">{c.case_number}</p>
                          </div>
                          <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {client.gst_number && (
                <div>
                  <p className="text-gray-500">GST Number</p>
                  <p className="font-medium">{client.gst_number}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Client Since</p>
                <p className="font-medium">{formatDate(client.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: escapeHtml(client.notes) }} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
