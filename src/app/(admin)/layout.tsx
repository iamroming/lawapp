"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from "@/components/admin-header";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // Allow owners, partners, and super_admins to access admin panel
      const allowedRoles = ["owner", "partner", "super_admin"];
      if (!profile?.role || !allowedRoles.includes(profile.role)) {
        router.push("/dashboard");
        return;
      }

      setIsAdmin(true);
    };

    checkAdmin();
  }, [supabase, router]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--text-secondary)]">Checking permissions...</div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--background)]">
        <AdminSidebar />
        <div className="lg:pl-64">
          <div className="pt-14 lg:pt-0 pb-16 lg:pb-0">
            <AdminHeader />
            <main className="p-4 lg:p-6 mobile-content-area lg:mobile-content-area-0">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
