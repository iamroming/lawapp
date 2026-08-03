import { NextRequest, NextResponse } from "next/server";
import { courtServiceFetch } from "@/lib/court-service";

export async function GET() {
  try {
    const data = await courtServiceFetch("/api/dc/states");
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
