import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import {
  searchIndianKanoon,
  buildSearchQuery,
  calculateRelevance,
  CaseLawResult,
} from "@/lib/legal/indian-kanoon";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  const user = await verifySessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch case with acts/sections/clauses
  const { data: caseData, error: caseError } = await supabase
    .from("cases")
    .select("id, acts, sections, clauses, firm_id, created_by, assigned_to")
    .eq("id", id)
    .single();

  if (caseError || !caseData) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  // Verify firm access
  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", user.uuid)
    .single();

  const effectiveFirmId = profile?.firm_id || user.uuid;
  const isPrivileged = profile?.role === "owner" || profile?.role === "partner";

  // Firm members can only access their own firm's cases
  if (caseData.firm_id !== effectiveFirmId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Non-privileged users can only access cases they created or are assigned to
  if (!isPrivileged && caseData.created_by !== user.uuid && caseData.assigned_to !== user.uuid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const acts = caseData.acts || [];
  const sections = caseData.sections || [];
  const clauses = caseData.clauses || [];

  if (acts.length === 0 && sections.length === 0) {
    return NextResponse.json({
      results: [],
      message: "No acts or sections specified for this case",
    });
  }

  // Check cache first (skip if force refresh or cache is old)
  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from("case_law_results")
      .select("*")
      .eq("case_id", id)
      .order("relevance_score", { ascending: false })
      .limit(20);

    // Use cache if fetched within last 24 hours
    if (cached && cached.length > 0) {
      const lastFetch = new Date(cached[0].fetched_at);
      const hoursSince = (Date.now() - lastFetch.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        return NextResponse.json({ results: cached, source: "cache" });
      }
    }
  }

  // Search Indian Kanoon
  const query = buildSearchQuery(acts, sections, clauses);
  if (!query) {
    return NextResponse.json({ results: [], message: "Could not build search query" });
  }

  const rawResults = await searchIndianKanoon(query);

  // Calculate relevance and build results
  const results: CaseLawResult[] = rawResults
    .map((r) => ({
      title: r.title,
      citation: r.citation,
      court: r.court,
      judgment_date: r.date,
      judges: r.judges,
      excerpt: r.excerpt,
      url: r.url,
      relevance_score: calculateRelevance(r, acts, sections, clauses),
      matched_sections: sections.filter(
        (s: string) =>
          r.title.toLowerCase().includes(`section ${s.toLowerCase()}`) ||
          r.excerpt.toLowerCase().includes(`section ${s.toLowerCase()}`)
      ),
      source: "indian_kanoon" as const,
    }))
    .filter((r) => r.relevance_score > 0.1)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 15);

  // Cache results (delete old first)
  await supabase.from("case_law_results").delete().eq("case_id", id);

  if (results.length > 0) {
    const cacheRows = results.map((r) => ({
      case_id: id,
      title: r.title,
      citation: r.citation,
      court: r.court,
      judgment_date: r.judgment_date || null,
      judges: r.judges,
      excerpt: r.excerpt,
      url: r.url,
      relevance_score: r.relevance_score,
      matched_sections: r.matched_sections,
      source: r.source,
    }));

    await supabase.from("case_law_results").insert(cacheRows);
  }

  return NextResponse.json({ results, source: "fresh" });
}
