"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

function generateSessionId(): string {
  if (typeof window !== "undefined") {
    let sid = sessionStorage.getItem("analytics_sid");
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("analytics_sid", sid);
    }
    return sid;
  }
  return "server";
}

function trackEvent(eventType: string, pageUrl: string, referrer?: string, userId?: string) {
  const sessionId = generateSessionId();

  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: eventType,
      page_url: pageUrl,
      referrer: referrer || document.referrer || null,
      session_id: sessionId,
      user_id: userId || null,
    }),
    keepalive: true,
  }).catch(() => {});
}

export function AnalyticsProvider() {
  const pathname = usePathname();
  const prevPath = useRef<string>("");
  const userId = useRef<string | null>(null);
  const initialized = useRef(false);

  // Track auth state
  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      const unsub = onAuthStateChanged(auth, (user) => {
        userId.current = user?.uid || null;
      });
      return () => unsub();
    } catch {
      // Firebase not available
    }
  }, []);

  // Track pageviews
  useEffect(() => {
    if (!pathname) return;

    // Skip tracking on API routes and static assets
    if (pathname.startsWith("/api/") || pathname.includes(".")) return;

    const url = pathname + (typeof window !== "undefined" ? window.location.search : "");

    // Avoid duplicate tracking for same path
    if (url === prevPath.current) return;
    prevPath.current = url;

    // Initial pageview on first load
    if (!initialized.current) {
      initialized.current = true;
      trackEvent("pageview", url, undefined, userId.current ?? undefined);
      return;
    }

    trackEvent("pageview", url, undefined, userId.current ?? undefined);
  }, [pathname]);

  // Track session duration on unload
  useEffect(() => {
    const handleUnload = () => {
      trackEvent("session_end", window.location.pathname, undefined, userId.current ?? undefined);
    };
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        handleUnload();
      }
    });
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("visibilitychange", handleUnload);
    };
  }, []);

  return null;
}
