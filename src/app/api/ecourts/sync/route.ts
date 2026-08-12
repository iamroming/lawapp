import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { getCaseByCNR, bulkRefreshCases } from "@/lib/ecourts/api";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { case_id, ecourts_case_id } = body;

    // Get firm_id for case scoping
    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const firmId = profile?.firm_id || user.uuid;

    // Get the ecourts case to sync
    let query = supabase.from("ecourts_cases").select("*").eq("is_active", true);
    
    if (ecourts_case_id) {
      query = query.eq("id", ecourts_case_id);
    } else if (case_id) {
      query = query.eq("case_id", case_id);
    }

    // For targeted syncs, verify the case belongs to the user's firm
    if (ecourts_case_id || case_id) {
      const { data: targetedCases, error: targetedError } = await query;
      if (targetedError || !targetedCases?.length) {
        return NextResponse.json({ error: "No cases to sync" }, { status: 404 });
      }

      for (const ec of targetedCases) {
        const { data: parentCase } = await supabase
          .from("cases")
          .select("firm_id")
          .eq("id", ec.case_id)
          .single();
        if (parentCase && parentCase.firm_id !== firmId) {
          return NextResponse.json({ error: "Case does not belong to your firm" }, { status: 403 });
        }
      }

      var ecourtsCases = targetedCases;
      var fetchError = targetedError;
    } else {
      // Sync all active cases for the firm
      const { data: firmCases } = await supabase
        .from("cases")
        .select("id")
        .eq("firm_id", firmId);
      
      if (firmCases?.length) {
        const caseIds = firmCases.map((c) => c.id);
        query = query.in("case_id", caseIds);
      } else {
        return NextResponse.json({ error: "No cases to sync" }, { status: 404 });
      }

      var fetchResult = await query;
      var ecourtsCases = fetchResult.data;
      var fetchError = fetchResult.error;
    }

    if (fetchError || !ecourtsCases?.length) {
      return NextResponse.json({ error: "No cases to sync" }, { status: 404 });
    }

    // Bulk refresh all CNRs first
    const cnrs = ecourtsCases.map((ec) => ec.cnr_number).filter(Boolean);
    const bulkData = new Map<string, ReturnType<typeof getCaseByCNR> extends Promise<infer R> ? R : never>();
    if (cnrs.length > 0) {
      const bulkResult = await bulkRefreshCases(cnrs);
      if (Array.isArray(bulkResult)) {
        for (const item of bulkResult) {
          if (item?.cnr_number) bulkData.set(item.cnr_number, item);
        }
      }
    }

    const results = [];

    for (const ec of ecourtsCases) {
      try {
        // Get data from bulk result or fetch individually as fallback
        let caseDetail = bulkData.get(ec.cnr_number) || null;
        if (!caseDetail) {
          caseDetail = await getCaseByCNR(ec.cnr_number);
        }

        if (!caseDetail) {
          throw new Error(`Case not found for CNR: ${ec.cnr_number}`);
        }

        // Build new status from real data
        const newStatus = {
          status: caseDetail.caseStatus || "UNKNOWN",
          next_hearing_date: caseDetail.nextHearingDate || null,
          case_stage: caseDetail.caseStage || null,
          judge_name: caseDetail.judgeName || null,
          last_hearing_date: caseDetail.lastHearingDate || null,
          petitioners: caseDetail.petitioners,
          respondents: caseDetail.respondents,
          order_count: caseDetail.orders.length,
        };

        // Detect changes
        const changes = detectChanges(ec, newStatus);

        // Update the record
        const { error: updateError } = await supabase
          .from("ecourts_cases")
          .update({
            last_synced_at: new Date().toISOString(),
            last_status: newStatus.status,
            next_hearing_date: newStatus.next_hearing_date,
            case_stage: newStatus.case_stage,
            judge_name: newStatus.judge_name,
            last_hearing_date: newStatus.last_hearing_date,
          })
          .eq("id", ec.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        // Log sync
        await supabase.from("ecourts_sync_log").insert({
          ecourts_case_id: ec.id,
          sync_type: "status",
          status: "success",
          data_before: { last_status: ec.last_status },
          data_after: newStatus,
        });

        // Create notifications for changes
        if (changes.length > 0) {
          await createChangeNotifications(supabase, ec, changes);
        }

        results.push({ id: ec.id, cnr: ec.cnr_number, status: "synced", changes });
      } catch (error) {
        await supabase.from("ecourts_sync_log").insert({
          ecourts_case_id: ec.id,
          sync_type: "status",
          status: "error",
          error_message: error instanceof Error ? error.message : "Unknown error",
        });
        results.push({ id: ec.id, cnr: ec.cnr_number, status: "error", error: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    return NextResponse.json({ data: results });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function detectChanges(oldRecord: Record<string, unknown>, newStatus: Record<string, unknown>) {
  const changes: string[] = [];
  
  if (oldRecord.next_hearing_date !== newStatus.next_hearing_date) {
    changes.push(`Hearing date changed: ${oldRecord.next_hearing_date || "N/A"} → ${newStatus.next_hearing_date || "N/A"}`);
  }
  if (oldRecord.last_status !== newStatus.status) {
    changes.push(`Status changed: ${oldRecord.last_status || "N/A"} → ${newStatus.status || "N/A"}`);
  }
  if (oldRecord.case_stage !== newStatus.case_stage) {
    changes.push(`Stage changed: ${oldRecord.case_stage || "N/A"} → ${newStatus.case_stage || "N/A"}`);
  }
  if (oldRecord.judge_name !== newStatus.judge_name) {
    changes.push(`Judge changed: ${oldRecord.judge_name || "N/A"} → ${newStatus.judge_name || "N/A"}`);
  }
  
  return changes;
}

async function createChangeNotifications(supabaseArg: unknown, ecourtsCase: Record<string, unknown>, changes: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabaseArg as any;
  
  // Get case details
  const { data: caseData } = await client
    .from("cases")
    .select("id, title, case_number, assigned_to, created_by")
    .eq("id", ecourtsCase.case_id)
    .single();

  if (!caseData) return;

  const userId = caseData.assigned_to || caseData.created_by;
  if (!userId) return;

  await client.from("notifications").insert({
    user_id: userId,
    type: "case_update",
    title: `Case Update: ${caseData.case_number}`,
    message: changes.join("\n"),
    channels: ["in_app"],
    data: {
      case_id: caseData.id,
      ecourts_case_id: ecourtsCase.id,
      changes,
    },
  });
}
