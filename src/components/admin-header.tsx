"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { User } from "@supabase/supabase-js";

export function AdminHeader() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  return (
    <header className="h-14 lg:h-16 border-b bg-white flex items-center justify-between pl-14 lg:pl-6 pr-3 lg:pr-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
          Firm Owner
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium">{user?.email}</p>
          <p className="text-xs text-gray-500">Owner</p>
        </div>
        <Avatar
          name={user?.user_metadata?.full_name || user?.email || "O"}
          size="md"
        />
      </div>
    </header>
  );
}
