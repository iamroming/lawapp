"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { checkSuperAdminAccess } from "./super-admin";

export async function getSiteAnalytics(params: {
  period?: "today" | "7d" | "30d" | "90d" | "all";
} = {}) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const period = params.period || "30d";

  const now = new Date();
  let startDate: Date | null = new Date();

  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "7d":
      startDate.setDate(now.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(now.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(now.getDate() - 90);
      break;
    case "all":
      startDate = null;
      break;
  }

  let query = serviceRoleClient.from("analytics_events").select("*");
  if (startDate) {
    query = query.gte("created_at", startDate.toISOString());
  }
  const { data: events } = await query;

  const allEvents = events || [];

  // Unique visitors (by session_id)
  const uniqueSessions = new Set(allEvents.map((e) => e.session_id));
  const uniqueVisitors = uniqueSessions.size;

  // Total pageviews
  const pageviews = allEvents.filter((e) => e.event_type === "pageview");

  // Sessions with duration
  const sessionMap: Record<string, { start: string; end: string; pages: string[] }> = {};
  for (const e of allEvents) {
    if (!sessionMap[e.session_id]) {
      sessionMap[e.session_id] = { start: e.created_at, end: e.created_at, pages: [] };
    }
    if (e.created_at > sessionMap[e.session_id].end) {
      sessionMap[e.session_id].end = e.created_at;
    }
    if (e.event_type === "pageview" && e.page_url) {
      sessionMap[e.session_id].pages.push(e.page_url);
    }
  }

  // Average session duration
  const durations = Object.values(sessionMap).map((s) => {
    return (new Date(s.end).getTime() - new Date(s.start).getTime()) / 1000;
  });
  const avgSessionDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  // Bounce rate (sessions with only 1 pageview)
  const singlePageSessions = Object.values(sessionMap).filter((s) => s.pages.length <= 1).length;
  const bounceRate = uniqueVisitors > 0 ? Math.round((singlePageSessions / uniqueVisitors) * 100) : 0;

  // Top pages
  const pageCounts: Record<string, number> = {};
  for (const p of pageviews) {
    const url = p.page_url || "unknown";
    pageCounts[url] = (pageCounts[url] || 0) + 1;
  }
  const topPages = Object.entries(pageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([page, views]) => ({ page, views }));

  // Top referrers
  const referrerCounts: Record<string, number> = {};
  for (const e of allEvents) {
    if (e.referrer && !e.referrer.includes("casefiles.in")) {
      referrerCounts[e.referrer] = (referrerCounts[e.referrer] || 0) + 1;
    }
  }
  const topReferrers = Object.entries(referrerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([referrer, visits]) => ({ referrer, visits }));

  // Device breakdown
  const deviceCounts: Record<string, number> = {};
  for (const e of allEvents) {
    const device = e.device_type || "unknown";
    deviceCounts[device] = (deviceCounts[device] || 0) + 1;
  }
  const deviceBreakdown = Object.entries(deviceCounts)
    .map(([device, count]) => ({ device, count }));

  // Browser breakdown
  const browserCounts: Record<string, number> = {};
  for (const e of allEvents) {
    const browser = e.browser || "unknown";
    browserCounts[browser] = (browserCounts[browser] || 0) + 1;
  }
  const browserBreakdown = Object.entries(browserCounts)
    .map(([browser, count]) => ({ browser, count }));

  // Daily visitors
  const dailyVisitors: Record<string, Set<string>> = {};
  const dailyPageviews: Record<string, number> = {};
  for (const e of allEvents) {
    const day = new Date(e.created_at).toISOString().slice(0, 10);
    if (!dailyVisitors[day]) dailyVisitors[day] = new Set();
    dailyVisitors[day].add(e.session_id);
    if (e.event_type === "pageview") {
      dailyPageviews[day] = (dailyPageviews[day] || 0) + 1;
    }
  }
  const trafficChart = Object.entries(dailyVisitors)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, visitors]) => ({
      date,
      visitors: visitors.size,
      pageviews: dailyPageviews[date] || 0,
    }));

  return {
    totalVisitors: uniqueVisitors,
    totalPageviews: pageviews.length,
    totalSessions: Object.keys(sessionMap).length,
    avgSessionDuration,
    bounceRate,
    topPages,
    topReferrers,
    deviceBreakdown,
    browserBreakdown,
    trafficChart,
  };
}
