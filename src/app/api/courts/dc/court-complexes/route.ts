import { NextRequest, NextResponse } from "next/server";
import courtData from "@/lib/court-data.json";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateCode = searchParams.get("state_code");
    const districtCode = searchParams.get("district_code");

    if (!districtCode) {
      return NextResponse.json({ error: "district_code is required" }, { status: 400 });
    }

    const stateData = (courtData as any)[stateCode || ""] || {};
    const allComplexes = stateData.complexes || {};
    let districtComplexes: string[] = allComplexes[districtCode] || [];

    if (districtComplexes.length === 0) {
      const districts = stateData.districts || {};
      const districtName = districts[districtCode] || `District ${districtCode}`;
      districtComplexes = [`${districtName} District Court`];
    }

    const result = districtComplexes.map((name, i) => ({
      court_complex_code: String(i + 1),
      court_complex_name: name,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
