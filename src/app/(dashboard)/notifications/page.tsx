"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "@/lib/notifications/service";
import { notificationTypeLabels, type Notification } from "@/lib/notifications/types";
import { Bell, Check, CheckCheck, Trash2, Clock, AlertTriangle, FileText, Settings } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

const typeIcons: Record<string, React.ReactNode> = {
  hearing_reminder: <Clock className="h-5 w-5 text-blue-500" />,
  payment_due: <AlertTriangle className="h-5 w-5 text-red-500" />,
  payment_received: <Check className="h-5 w-5 text-green-500" />,
  case_update: <FileText className="h-5 w-5 text-purple-500" />,
  document_uploaded: <FileText className="h-5 w-5 text-cyan-500" />,
  deadline_approaching: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  system: <Bell className="h-5 w-5 text-[var(--text-secondary)]" />,
};

const typeColors: Record<string, string> = {
  hearing_reminder: "bg-blue-100 text-blue-800",
  payment_due: "bg-red-100 text-red-800",
  payment_received: "bg-green-100 text-green-800",
  case_update: "bg-purple-100 text-purple-800",
  document_uploaded: "bg-cyan-100 text-cyan-800",
  deadline_approaching: "bg-orange-100 text-orange-800",
  system: "bg-gray-100 text-gray-800",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const data = await getNotifications(user.id);
        setNotifications(data);
      }
      setLoading(false);
    };
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    toast.success("Marked as read");
  };

  const handleMarkAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All marked as read");
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteNotification(deleteTarget);
    setNotifications((prev) => prev.filter((n) => n.id !== deleteTarget));
    setDeleteTarget(null);
    toast.success("Notification deleted");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        <div className="text-center py-12 text-[var(--text-secondary)]">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Notifications</h1>
          <p className="text-[var(--text-secondary)] text-sm">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="text-sm">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
          <Link href="/notifications/preferences">
            <Button variant="outline" size="sm" className="text-sm">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </Button>
          </Link>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-primary)]">No notifications</h3>
              <p className="text-[var(--text-secondary)] mt-1">You're all caught up! Check back later for updates.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-colors ${!notification.read ? "bg-[var(--surface-subtle)] border-blue-200" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {typeIcons[notification.type] || <Bell className="h-5 w-5 text-[var(--text-secondary)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${!notification.read ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>
                        {notification.title}
                      </h3>
                      <Badge className={typeColors[notification.type] || "bg-gray-100 text-gray-800"}>
                        {notificationTypeLabels[notification.type]?.en || notification.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">{notification.message}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{formatDateTime(notification.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
