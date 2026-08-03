import { NextRequest, NextResponse } from "next/server";
import courtData from "@/lib/court-data.json";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateCode = searchParams.get("state_code");

    if (!stateCode) {
      return NextResponse.json({ error: "state_code is required" }, { status: 400 });
    }

    const stateData = (courtData as any)[stateCode];
    const districts = stateData?.districts || {};
    const result = Object.entries(districts).map(([code, name]) => ({
      district_code: code,
      district_name: name,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
