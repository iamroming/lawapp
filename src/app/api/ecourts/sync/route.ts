import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCaseByCNR, bulkRefreshCases } from "@/lib/ecourts/api";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { case_id, ecourts_case_id } = body;

    // Get the ecourts case to sync
    let query = supabase.from("ecourts_cases").select("*").eq("is_active", true);
    
    if (ecourts_case_id) {
      query = query.eq("id", ecourts_case_id);
    } else if (case_id) {
      query = query.eq("case_id", case_id);
    } else {
      // Sync all active cases for the user - get case IDs first
      const { data: userCases } = await supabase
        .from("cases")
        .select("id")
        .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`);
      
      if (userCases?.length) {
        const caseIds = userCases.map((c) => c.id);
        query = query.in("case_id", caseIds);
      } else {
        return NextResponse.json({ error: "No cases to sync" }, { status: 404 });
      }
    }

    const { data: ecourtsCases, error: fetchError } = await query;

    if (fetchError || !ecourtsCases?.length) {
      return NextResponse.json({ error: "No cases to sync" }, { status: 404 });
    }

    // Bulk refresh all CNRs first
    const cnrs = ecourtsCases.map((ec) => ec.cnr_number).filter(Boolean);
    if (cnrs.length > 0) {
      await bulkRefreshCases(cnrs);
    }

    const results = [];

    for (const ec of ecourtsCases) {
      try {
        // Fetch real case data from eCourts API
        const caseDetail = await getCaseByCNR(ec.cnr_number);
        
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
