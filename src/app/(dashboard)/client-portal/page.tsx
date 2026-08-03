"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Briefcase,
  IndianRupee,
  Loader2,
  ExternalLink,
  UserPlus,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";

interface PortalUser {
  id: string;
  email: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  client: {
    id: string;
    full_name: string;
    phone: string;
    email: string;
  } | null;
}

interface Client {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
}

export default function ClientPortalPage() {
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviting, setInviting] = useState(false);
  const supabase = createClient();

  const [inviteData, setInviteData] = useState({
    client_id: "",
    email: "",
  });

  useEffect(() => {
    fetchPortalUsers();
    fetchClients();
  }, []);

  const fetchPortalUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("client_portal_users")
        .select("*, client:clients(id, full_name, phone, email)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPortalUsers((data || []) as PortalUser[]);
    } catch (error) {
      console.error("Error fetching portal users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, full_name, phone, email")
      .is("deleted_at", null);
    setClients((data || []) as Client[]);
  };

  const handleInvite = async () => {
    if (!inviteData.client_id || !inviteData.email) {
      toast.error("Client and email are required");
      return;
    }

    setInviting(true);
    try {
      const response = await fetch("/api/client-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteData),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error);
      }

      toast.success("Portal access created. Invitation sent!");
      setShowInviteModal(false);
      setInviteData({ client_id: "", email: "" });
      fetchPortalUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create portal access");
    } finally {
      setInviting(false);
    }
  };

  const filteredPortalUsers = portalUsers.filter((pu) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      pu.client?.full_name?.toLowerCase().includes(query) ||
      pu.email?.toLowerCase().includes(query) ||
      pu.client?.phone?.includes(query)
    );
  });

  const activeUsers = portalUsers.filter((pu) => pu.is_active).length;
  const totalLogins = portalUsers.filter((pu) => pu.last_login).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Client Portal
          </h1>
          <p className="text-[var(--text-secondary)]">Give clients self-service access to their cases and documents</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Portal Users</p>
                <p className="text-2xl font-bold">{portalUsers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Active Users</p>
                <p className="text-2xl font-bold">{activeUsers}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Clients with Access</p>
                <p className="text-2xl font-bold">{totalLogins}</p>
              </div>
              <ExternalLink className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Portal Users List */}
      {filteredPortalUsers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No portal users yet</h3>
            <p className="text-[var(--text-secondary)] mb-4">Invite your first client to give them case access</p>
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPortalUsers.map((pu) => (
            <Card key={pu.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface-accent)] flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {pu.client?.full_name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{pu.client?.full_name}</h3>
                      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {pu.email}
                        </span>
                        {pu.client?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {pu.client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={pu.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {pu.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {pu.last_login && (
                      <span className="text-xs text-[var(--text-secondary)]">
                        Last login: {new Date(pu.last_login).toLocaleDateString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Client to Portal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Select Client *</label>
            <select
              value={inviteData.client_id}
              onChange={(e) => {
                const client = clients.find((c) => c.id === e.target.value);
                setInviteData({
                  client_id: e.target.value,
                  email: client?.email || "",
                });
              }}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Select a client...</option>
              {clients
                .filter((c) => !portalUsers.some((pu) => pu.client?.id === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} - {c.phone}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Email Address *</label>
            <Input
              type="email"
              placeholder="client@example.com"
              value={inviteData.email}
              onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
            />
          </div>
          <div className="bg-[var(--surface-subtle)] p-3 rounded-lg text-sm text-blue-800">
            <p>The client will receive an email with instructions to access the portal where they can:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>View their cases and hearing dates</li>
              <li>Download documents shared with them</li>
              <li>View invoices and make payments</li>
              <li>Send messages to their lawyer</li>
            </ul>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting}>
              {inviting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Send Invitation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
