// Indian Kanoon API client for fetching relevant case laws
// API docs: https://api.indiankanoon.org/

const INDIAN_KANOON_BASE = "https://api.indiankanoon.org";

export interface IndianKanoonResult {
  title: string;
  citation: string;
  court: string;
  date: string;
  judges: string[];
  excerpt: string;
  url: string;
  docid: number;
}

export interface CaseLawResult {
  title: string;
  citation: string;
  court: string;
  judgment_date: string;
  judges: string[];
  excerpt: string;
  url: string;
  relevance_score: number;
  matched_sections: string[];
  source: "indian_kanoon" | "internal";
}

// Build search query from acts and sections
export function buildSearchQuery(acts: string[], sections: string[], clauses: string[]): string {
  const parts: string[] = [];

  // Add sections with act names
  for (const section of sections) {
    if (acts.length > 0) {
      // Try to find matching act for this section
      const sectionNum = section.replace(/[^0-9]/g, "");
      const matchedAct = acts.find((a) => {
        const shortName = getShortActName(a);
        return shortName;
      });
      if (matchedAct) {
        parts.push(`section ${section} ${getShortActName(matchedAct)}`);
      } else {
        parts.push(`section ${section}`);
      }
    } else {
      parts.push(`section ${section}`);
    }
  }

  // Add full act names
  for (const act of acts) {
    parts.push(getShortActName(act));
  }

  // Add clauses
  for (const clause of clauses) {
    parts.push(clause);
  }

  // If no parts, use first act as fallback
  if (parts.length === 0 && acts.length > 0) {
    parts.push(getShortActName(acts[0]));
  }

  return parts.join(" ");
}

// Get short/common name for an act
function getShortActName(act: string): string {
  const actMap: Record<string, string> = {
    "Indian Penal Code": "IPC",
    "Bharatiya Nyaya Sanhita": "BNS",
    "Code of Criminal Procedure": "CrPC",
    "Bharatiya Nagarik Suraksha Sanhita": "BNSS",
    "Code of Civil Procedure": "CPC",
    "Indian Evidence Act": "Evidence Act",
    "Bharatiya Sakshya Adhiniyam": "BSA",
    "Indian Contract Act": "Contract Act",
    "Transfer of Property Act": "Transfer of Property",
    "Specific Relief Act": "Specific Relief",
    "Indian Partnership Act": "Partnership Act",
    "Companies Act": "Companies Act",
    "Negotiable Instruments Act": "NI Act",
    "Consumer Protection Act": "Consumer Protection",
    "Arbitration and Conciliation Act": "Arbitration Act",
    "Insolvency and Bankruptcy Code": "IBC",
    "Customs Act": "Customs Act",
    "Income Tax Act": "Income Tax Act",
    "Goods and Services Tax Act": "GST Act",
    "Central Goods and Services Tax Act": "CGST Act",
    "Labour Laws": "Labour Law",
    "Industrial Disputes Act": "Industrial Disputes",
    "Factories Act": "Factories Act",
    "Minimum Wages Act": "Minimum Wages",
    "Protection of Women from Domestic Violence Act": "Domestic Violence Act",
    "SC/ST (Prevention of Atrocities) Act": "SC ST Act",
    "Right to Education Act": "RTE Act",
    "Information Technology Act": "IT Act",
    "Motor Vehicles Act": "Motor Vehicles",
    "Environment Protection Act": "Environment Act",
  };

  // Try exact match first
  if (actMap[act]) return actMap[act];

  // Try partial match
  for (const [key, val] of Object.entries(actMap)) {
    if (act.toLowerCase().includes(key.toLowerCase())) return val;
  }

  return act;
}

// Search Indian Kanoon API
export async function searchIndianKanoon(
  query: string,
  page: number = 0
): Promise<IndianKanoonResult[]> {
  const apiKey = process.env.INDIAN_KANOON_API_KEY;

  // Build URL
  const params = new URLSearchParams({
    formInput: query,
    pagenum: String(page),
  });

  const headers: Record<string, string> = {};
  if (apiKey) {
    headers["Authorization"] = `Token ${apiKey}`;
  }

  try {
    const response = await fetch(
      `${INDIAN_KANOON_BASE}/search/formText/?${params.toString()}`,
      {
        method: "GET",
        headers,
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.error(`Indian Kanoon API error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!data.docs || !Array.isArray(data.docs)) {
      return [];
    }

    return data.docs.map((doc: any) => ({
      title: doc.doc_title || "Untitled",
      citation: doc.doc_source || "",
      court: extractCourt(doc),
      date: doc.doc_date || "",
      judges: extractJudges(doc),
      excerpt: doc.doc_excerpt || "",
      url: doc.doc_url || `https://indiankanoon.org/doc/${doc.docid}/`,
      docid: doc.docid || 0,
    }));
  } catch (error) {
    console.error("Indian Kanoon search failed:", error);
    return [];
  }
}

// Extract court name from doc
function extractCourt(doc: any): string {
  const title = (doc.doc_title || "").toLowerCase();
  const source = (doc.doc_source || "").toLowerCase();

  if (title.includes("supreme court") || source.includes("supreme court")) return "Supreme Court";
  if (title.includes("high court") || source.includes("high court")) {
    // Try to extract specific HC
    const hcMatch = title.match(/(\w+)\s+high\s+court/i);
    if (hcMatch) return `${hcMatch[1]} High Court`;
    return "High Court";
  }
  if (title.includes("tribunal") || source.includes("tribunal")) return "Tribunal";
  if (title.includes("district court") || source.includes("district")) return "District Court";
  if (title.includes("sessions court")) return "Sessions Court";

  return "Court";
}

// Extract judge names from doc
function extractJudges(doc: any): string[] {
  const bench = doc.doc_bench || "";
  if (!bench) return [];

  // Split by common separators
  return bench
    .split(/[,;&]/)
    .map((j: string) => j.trim())
    .filter((j: string) => j.length > 0);
}

// Calculate relevance score based on matched terms
export function calculateRelevance(
  result: IndianKanoonResult,
  acts: string[],
  sections: string[],
  clauses: string[]
): number {
  let score = 0;
  const titleLower = result.title.toLowerCase();
  const excerptLower = result.excerpt.toLowerCase();

  // Match on sections
  for (const section of sections) {
    if (excerptLower.includes(`section ${section}`) || titleLower.includes(`section ${section}`)) {
      score += 0.3;
    }
  }

  // Match on act names
  for (const act of acts) {
    const shortName = getShortActName(act).toLowerCase();
    if (excerptLower.includes(shortName) || titleLower.includes(shortName)) {
      score += 0.2;
    }
  }

  // Match on clauses
  for (const clause of clauses) {
    if (excerptLower.includes(clause.toLowerCase())) {
      score += 0.1;
    }
  }

  // Boost for Supreme Court judgments
  if (result.court === "Supreme Court") score += 0.1;

  // Boost for recent judgments (within 5 years)
  if (result.date) {
    const year = parseInt(result.date.split("-")[0]);
    if (year >= new Date().getFullYear() - 5) score += 0.05;
  }

  return Math.min(score, 1);
}
