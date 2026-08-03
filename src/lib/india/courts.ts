export interface Court {
  id: string;
  name: string;
  nameHi: string;
  level: "supreme" | "high_court" | "district" | "sessions" | "magistrate" | "family" | "commercial" | "tribunal" | "consumer";
  state?: string;
}

export const courtHierarchy: Court[] = [
  { id: "sc", name: "Supreme Court of India", nameHi: "\u092d\u093e\u0930\u0924 \u0928\u094d\u092f\u093e\u092f \u0905\u0926\u093e\u0932\u0924", level: "supreme" },

  { id: "hc_delhi", name: "Delhi High Court", nameHi: "\u0926\u093f\u0932\u094d\u0932\u0940 \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "DL" },
  { id: "hc_maharashtra", name: "Bombay High Court", nameHi: "\u092e\u0941\u0902\u092c\u0908 \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "MH" },
  { id: "hc_karnataka", name: "Karnataka High Court", nameHi: "\u0915\u0930\u094d\u0928\u093e\u091f\u0915 \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "KA" },
  { id: "hc_tamil_nadu", name: "Madras High Court", nameHi: "\u092e\u0926\u094d\u0930\u093e\u0938 \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "TN" },
  { id: "hc_wb", name: "Calcutta High Court", nameHi: "\u0915\u0932\u0915\u0924\u094d\u091a \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "WB" },
  { id: "hc_up", name: "Allahabad High Court", nameHi: "\u0905\u0932\u0939\u093e\u092c\u093e\u0926 \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "UP" },
  { id: "hc_gujarat", name: "Gujarat High Court", nameHi: "\u0917\u0941\u091c\u0930\u093e\u0924 \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "GJ" },
  { id: "hc_rajasthan", name: "Rajasthan High Court", nameHi: "\u0930\u093e\u091c\u0938\u094d\u0925\u093e\u0928 \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "RJ" },
  { id: "hc_mp", name: "Madhya Pradesh High Court", nameHi: "\u092e\u0927\u094d\u092f \u092a\u094d\u0930\u0926\u0947\u0936 \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "MP" },
  { id: "hc_ap", name: "Andhra Pradesh High Court", nameHi: "\u0906\u0902\u0927\u094d\u0930 \u092a\u094d\u0930\u0926\u0947\u0936 \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "AP" },
  { id: "hc_telangana", name: "Telangana High Court", nameHi: "\u0924\u0947\u0932\u0902\u0917\u093e\u0928\u093e \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "TS" },
  { id: "hc_kerala", name: "Kerala High Court", nameHi: "\u0915\u0947\u0930\u0932 \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "KL" },
  { id: "hc_punjab", name: "Punjab & Haryana High Court", nameHi: "\u092a\u0902\u091c\u093e\u092c \u0914\u0930 \u0939\u0930\u093f\u092f\u093e\u0923\u093e \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "PB" },
  { id: "hc_bihar", name: "Patna High Court", nameHi: "\u092a\u091f\u0928\u093e \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "BR" },
  { id: "hc_odisha", name: "Orissa High Court", nameHi: "\u0913\u0930\u093f\u0936\u093e \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "OR" },
  { id: "hc_jharkhand", name: "Jharkhand High Court", nameHi: "\u091d\u093e\u0930\u0916\u0921 \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "JH" },
  { id: "hc_assam", name: "Gauhati High Court", nameHi: "\u0917\u0941\u0939\u093e\u091f\u0940 \u0909\u091a\u094d\u091a \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "high_court", state: "AS" },

  { id: "district", name: "District Court", nameHi: "\u091c\u093f\u0932\u093e \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "district" },
  { id: "sessions", name: "Sessions Court", nameHi: "\u0938\u0947\u0936\u0928 \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "sessions" },
  { id: "magistrate", name: "Magistrate Court", nameHi: "\u092e\u094d\u091c\u093f\u0938\u094d\u091f\u094d\u0930\u0947\u091f \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "magistrate" },
  { id: "family", name: "Family Court", nameHi: "\u092a\u093e\u0930\u093f\u0935\u093e\u0930 \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "family" },
  { id: "commercial", name: "Commercial Court", nameHi: "\u0935\u093e\u0923\u093f\u091c\u094d\u092f \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "commercial" },
  { id: "tribunal", name: "Tribunal", nameHi: "\u0928\u094d\u092f\u093e\u092f\u0932\u092f \u0928\u094d\u092f\u093e\u092f\u0932\u092f", level: "tribunal" },
  { id: "consumer", name: "Consumer Forum", nameHi: "\u0909\u092a\u092d\u094b\u0915\u094d\u0924\u093e \u092e\u0902\u091a", level: "consumer" },
];

export function getCourtsByState(stateCode: string): Court[] {
  const stateHighCourts = courtHierarchy.filter(
    (c) => c.level === "high_court" && c.state === stateCode
  );
  const lowerCourts = courtHierarchy.filter(
    (c) => c.level !== "supreme" && c.level !== "high_court"
  );
  return [...stateHighCourts, ...lowerCourts];
}

export function getHighCourts(): Court[] {
  return courtHierarchy.filter((c) => c.level === "high_court");
}

export function getAllCourts(): Court[] {
  return courtHierarchy;
}
