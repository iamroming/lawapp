"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SuperAdminSidebar } from "@/components/super-admin-sidebar";
import { SuperAdminHeader } from "@/components/super-admin-header";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user is in super_admins table
      const { data } = await supabase
        .from("super_admins")
        .select("id, access_level")
        .eq("id", user.id)
        .single();

      if (!data) {
        // Not a super admin, redirect
        router.push("/dashboard");
        return;
      }

      setAuthorized(true);
    };

    checkAccess();
  }, [supabase, router]);

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full border-4 border-[var(--text-primary)] border-t-transparent animate-spin" />
          <p className="text-[var(--text-secondary)]">Verifying owner access...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--background)]">
        <SuperAdminSidebar />
        <div className="lg:pl-64">
          <div className="pt-14 lg:pt-0 pb-16 lg:pb-0">
            <SuperAdminHeader />
            <main className="p-4 lg:p-6 mobile-content-area lg:mobile-content-area-0">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
