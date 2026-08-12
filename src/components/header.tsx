"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { Avatar } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notification-bell";
import { GlobalSearch } from "@/components/global-search";
import { ROLE_DISPLAY_NAMES } from "@/types/database";
import { firebaseUidToUuid } from "@/lib/firebase/uid";

interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export function Header() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", firebaseUidToUuid(firebaseUser.uid))
          .single();
        if (profile?.role) {
          setUserRole(profile.role);
        }
      }
    };
    getUser();
  }, [supabase]);

  return (
    <header className="h-14 lg:h-14 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between pl-14 lg:pl-6 pr-3 lg:pr-6 gap-2">
      <div className="flex-1 max-w-md min-w-0">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        <NotificationBell />
        <div className="text-right hidden md:block">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[160px]">{user?.email}</p>
          <p className="text-xs text-[var(--text-tertiary)]">
            {ROLE_DISPLAY_NAMES[userRole || ""] || userRole || "Associate"}
          </p>
        </div>
        <Avatar
          name={user?.displayName || user?.email || "U"}
          size="md"
        />
      </div>
    </header>
  );
}
