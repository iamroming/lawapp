"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Crown } from "lucide-react";

export function SuperAdminHeader() {
  const [email, setEmail] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email || "");
    };
    getUser();
  }, [supabase]);

  return (
    <header className="h-14 lg:h-16 border-b border-gray-200 bg-white flex items-center justify-between pl-14 lg:pl-6 pr-3 lg:pr-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white">
          <Crown className="h-3 w-3 mr-1" />
          OWNER ACCESS
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{email}</p>
          <p className="text-xs text-amber-600 font-medium">Super Admin</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
          SA
        </div>
      </div>
    </header>
  );
}
