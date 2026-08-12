"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

const PUBLIC_PATHS = ["/subscription-required", "/onboarding", "/login", "/signup", "/reset-password"];

export function ProfileGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const auth = getFirebaseAuth();
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;

      if (!user) {
        cancelled = true;
        router.push("/login");
        return;
      }

      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        if (!res.ok) {
          if (!cancelled) {
            setChecking(false);
          }
          return;
        }

        const { profile, subscription } = await res.json();

        if (cancelled) return;

        if (!profile) {
          cancelled = true;
          router.push("/onboarding");
          return;
        }

        if (profile.is_active === false) {
          cancelled = true;
          router.push("/login");
          return;
        }

        // Subscription gate: redirect to /subscription-required if no active subscription
        if (!subscription) {
          cancelled = true;
          router.push("/subscription-required");
          return;
        }

        setAllowed(true);
        setChecking(false);
      } catch {
        if (!cancelled) {
          setChecking(false);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
