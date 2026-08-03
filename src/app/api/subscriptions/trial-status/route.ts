import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkTrialStatus } from "@/lib/trial";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await checkTrialStatus(user.id);
  return NextResponse.json(status);
}
