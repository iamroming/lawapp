import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { ProfileGuard } from "@/components/profile-guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ProfileGuard>
        <div className="min-h-screen bg-[var(--background)] transition-colors">
          <Sidebar />
          <div className="lg:pl-64">
            <div className="pt-14 lg:pt-0 pb-16 lg:pb-0">
              <Header />
              <main className="p-4 lg:p-6 mobile-content-area lg:mobile-content-area-0">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
            </div>
          </div>
        </div>
      </ProfileGuard>
    </ThemeProvider>
  );
}
