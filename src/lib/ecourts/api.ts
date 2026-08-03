const ECOURTS_BASE_URL = "https://webapi.ecourtsindia.com";

function getApiKey(): string {
  const key = process.env.ECOURTS_API_KEY;
  if (!key) throw new Error("ECOURTS_API_KEY not configured");
  return key;
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

export interface ECourtsCaseDetail {
  cnr: string;
  caseType: string;
  caseStatus: string;
  filingDate: string | null;
  decisionDate: string | null;
  courtCode: string;
  courtName: string;
  judgeName: string | null;
  nextHearingDate: string | null;
  lastHearingDate: string | null;
  caseStage: string | null;
  listingBench: string | null;
  petitioners: string[];
  respondents: string[];
  advocates: { name: string; type: string }[];
  orders: {
    fileName: string;
    orderDate: string;
    orderType: string;
    url: string;
  }[];
  actsAndSections: string[];
  raw: Record<string, unknown>;
}

export interface ECourtsSearchResult {
  cnr: string;
  caseType: string;
  caseStatus: string;
  filingDate: string | null;
  courtCode: string;
  petitioners: string[];
  respondents: string[];
  nextHearingDate: string | null;
}

export async function getCaseByCNR(cnr: string): Promise<ECourtsCaseDetail | null> {
  try {
    const response = await fetch(`${ECOURTS_BASE_URL}/api/partner/case/${cnr}`, {
      headers: headers(),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`eCourts API error: ${response.status}`);
    }

    const json = await response.json();
    const courtCaseData = json.data?.courtCaseData || json.data || {};
    const entityInfo = json.data?.entityInfo || {};

    return {
      cnr: courtCaseData.cnr || cnr,
      caseType: courtCaseData.caseTypeRaw || courtCaseData.caseType || "",
      caseStatus: courtCaseData.caseStatus || "UNKNOWN",
      filingDate: courtCaseData.filingDate || null,
      decisionDate: courtCaseData.decisionDate || null,
      courtCode: courtCaseData.courtComplexCode || courtCaseData.courtCode || "",
      courtName: courtCaseData.courtName || "",
      judgeName: courtCaseData.judges?.[0] || courtCaseData.judgeName || null,
      nextHearingDate: entityInfo.nextDateOfHearing || courtCaseData.nextHearingDate || null,
      lastHearingDate: entityInfo.lastDateOfHearing?.split("T")[0] || courtCaseData.lastHearingDate || null,
      caseStage: courtCaseData.purpose || courtCaseData.caseStage || null,
      listingBench: courtCaseData.judicialSectionRaw || courtCaseData.listingBench || null,
      petitioners: courtCaseData.petitioners || [],
      respondents: courtCaseData.respondents || [],
      advocates: [
        ...(courtCaseData.petitionerAdvocates || []).map((name: string) => ({ name, type: "petitioner" })),
        ...(courtCaseData.respondentAdvocates || []).map((name: string) => ({ name, type: "respondent" })),
      ],
      orders: [
        ...(courtCaseData.judgmentOrders || []).map((o: Record<string, string>) => ({
          fileName: o.fileName || o.orderUrl || "",
          orderDate: o.orderDate || "",
          orderType: o.orderType || "judgment",
          url: o.orderUrl || "",
        })),
        ...(courtCaseData.interimOrders || []).map((o: Record<string, string>) => ({
          fileName: o.fileName || o.orderUrl || "",
          orderDate: o.orderDate || "",
          orderType: o.orderType || "interim",
          url: o.orderUrl || "",
        })),
      ],
      actsAndSections: courtCaseData.actsAndSections || [],
      raw: json,
    };
  } catch (error) {
    console.error(`Failed to fetch case ${cnr}:`, error);
    return null;
  }
}

export async function refreshCase(cnr: string): Promise<boolean> {
  try {
    const response = await fetch(`${ECOURTS_BASE_URL}/api/partner/case/${cnr}/refresh`, {
      method: "POST",
      headers: headers(),
    });
    return response.ok;
  } catch (error) {
    console.error(`Failed to refresh case ${cnr}:`, error);
    return false;
  }
}

export async function bulkRefreshCases(cnrs: string[]): Promise<{ cnr: string; status: string }[]> {
  try {
    const response = await fetch(`${ECOURTS_BASE_URL}/api/partner/case/bulk-refresh`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ cnrs }),
    });

    if (!response.ok) throw new Error(`Bulk refresh failed: ${response.status}`);

    const json = await response.json();
    return json.data || [];
  } catch (error) {
    console.error("Bulk refresh failed:", error);
    return cnrs.map((cnr) => ({ cnr, status: "error" }));
  }
}

export async function searchCases(query: string, filters?: {
  courtCode?: string;
  caseType?: string;
  caseStatus?: string;
  filingYear?: string;
}): Promise<ECourtsSearchResult[]> {
  try {
    const params = new URLSearchParams({ Query: query, Page: "1", PageSize: "20" });
    if (filters?.courtCode) params.set("CourtCodes", filters.courtCode);
    if (filters?.caseType) params.set("CaseTypes", filters.caseType);
    if (filters?.caseStatus) params.set("CaseStatuses", filters.caseStatus);
    if (filters?.filingYear) params.set("FilingYears", filters.filingYear);

    const response = await fetch(`${ECOURTS_BASE_URL}/api/partner/search?${params}`, {
      headers: headers(),
    });

    if (!response.ok) throw new Error(`Search failed: ${response.status}`);

    const json = await response.json();
    return (json.data?.results || []).map((r: Record<string, unknown>) => ({
      cnr: r.cnr as string,
      caseType: r.caseType as string,
      caseStatus: r.caseStatus as string,
      filingDate: r.filingDate as string | null,
      courtCode: r.courtCode as string,
      petitioners: (r.petitioners as string[]) || [],
      respondents: (r.respondents as string[]) || [],
      nextHearingDate: r.nextHearingDate as string | null,
    }));
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
}
