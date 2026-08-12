"use client";
import React, { createContext, useContext } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

const SuperAdminClientContext = createContext<SupabaseClient | null>(null);

export function SuperAdminClientProvider({
  client,
  children,
}: {
  client: SupabaseClient;
  children: React.ReactNode;
}) {
  return (
    <SuperAdminClientContext.Provider value={client}>
      {children}
    </SuperAdminClientContext.Provider>
  );
}

export function useSuperAdminClient(): SupabaseClient {
  const client = useContext(SuperAdminClientContext);
  if (!client) {
    throw new Error("useSuperAdminClient must be used within a SuperAdminClientProvider");
  }
  return client;
}
