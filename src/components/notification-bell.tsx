"use client";

import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { getUnreadCount } from "@/lib/notifications/service";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    let channel: any;

    const fetchCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const unreadCount = await getUnreadCount(user.id);
        setCount(unreadCount);
      }
    };

    fetchCount();

    channel = supabase
      .channel("notifications-unread")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
