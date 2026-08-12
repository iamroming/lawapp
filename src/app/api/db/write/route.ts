import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

const ALLOWED_TABLES: Record<string, { ownerField: string }> = {
  "cases": { ownerField: "firm_id" },
  "clients": { ownerField: "firm_id" },
  "hearings": { ownerField: "firm_id" },
  "messages": { ownerField: "created_by" },
  "tasks": { ownerField: "assigned_to" },
  "timesheets": { ownerField: "user_id" },
  "documents": { ownerField: "firm_id" },
  "time_entries": { ownerField: "user_id" },
  "invoices": { ownerField: "firm_id" },
  "expenses": { ownerField: "firm_id" },
  "consultations": { ownerField: "firm_id" },
  "consultation_slots": { ownerField: "firm_id" },
  "notifications": { ownerField: "user_id" },
  "case_alerts": { ownerField: "user_id" },
  "tags": { ownerField: "firm_id" },
  "team_members": { ownerField: "firm_id" },
  "invoice_items": { ownerField: "invoice_id" },
  "firm_profit_sharing": { ownerField: "firm_id" },
  "cause_list_entries": { ownerField: "user_id" },
};

const ALLOWED_TABLE_NAMES = Object.keys(ALLOWED_TABLES);

export async function POST(request: NextRequest) {
  let user = await verifySessionFromRequest(request);
  if (!user) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { getAdminAuth } = await import("@/lib/firebase/admin");
        const auth = await getAdminAuth();
        const decoded = await auth.verifyIdToken(authHeader.slice(7));
        const { firebaseUidToUuid } = await import("@/lib/firebase/uid");
        user = {
          uid: decoded.uid,
          uuid: firebaseUidToUuid(decoded.uid),
          email: decoded.email ?? null,
          displayName: decoded.name ?? null,
        };
      } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { table, operation, data, match, id } = body;

  if (!table || !ALLOWED_TABLE_NAMES.includes(table as string)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }
  if (!operation || !["insert", "update", "upsert", "delete"].includes(operation as string)) {
    return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
  }

  const tableConfig = ALLOWED_TABLES[table as string];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Look up user's actual firm_id from profile for firm-scoped tables
  let effectiveFirmId = user.uuid;
  if (tableConfig.ownerField === "firm_id") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id")
      .eq("id", user.uuid)
      .single();
    effectiveFirmId = profile?.firm_id || user.uuid;
  }

  try {
    let query: any;

    switch (operation) {
      case "insert": {
        const insertData = Array.isArray(data) ? data : [data];
        for (const row of insertData) {
          if (row[tableConfig.ownerField] && row[tableConfig.ownerField] !== effectiveFirmId) {
            return NextResponse.json({ error: "Cannot create records for other users" }, { status: 403 });
          }
          row[tableConfig.ownerField] = effectiveFirmId;
        }
        query = await supabase.from(table as string).insert(insertData.length === 1 ? insertData[0] : insertData).select();
        break;
      }
      case "update": {
        if (!match) {
          return NextResponse.json({ error: "match required for update" }, { status: 400 });
        }
        const secureMatch = { ...match, [tableConfig.ownerField]: effectiveFirmId };
        query = await supabase.from(table as string).update(data).match(secureMatch).select();
        break;
      }
      case "upsert": {
        const upsertData = Array.isArray(data) ? data : [data];
        for (const row of upsertData) {
          row[tableConfig.ownerField] = effectiveFirmId;
        }
        query = await supabase.from(table as string).upsert(upsertData.length === 1 ? upsertData[0] : upsertData).select();
        break;
      }
      case "delete": {
        if (!match) {
          return NextResponse.json({ error: "match required for delete" }, { status: 400 });
        }
        const secureDeleteMatch = { ...match, [tableConfig.ownerField]: effectiveFirmId };
        query = await supabase.from(table as string).delete().match(secureDeleteMatch);
        break;
      }
    }

    if (query.error) {
      return NextResponse.json({ error: query.error.message }, { status: 500 });
    }

    return NextResponse.json({ data: query.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
