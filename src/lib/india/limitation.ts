import { addYears, addMonths, addDays, isAfter, isBefore, startOfDay } from "date-fns";

export interface LimitationArticle {
  id: string;
  description: string;
  descriptionHi: string;
  period: number;
  periodUnit: "days" | "months" | "years";
  category: string;
}

export const limitationArticles: LimitationArticle[] = [
  { id: "58", description: "Suit for possession of immovable property", descriptionHi: "अचल संपत्ति के कब्जे का मुकदमा", period: 12, periodUnit: "years", category: "Property" },
  { id: "59", description: "Suit for possession after revocation of gift", descriptionHi: "दान वापसी के बाद कब्जे का मुकदमा", period: 3, periodUnit: "years", category: "Property" },
  { id: "60", description: "Suit to set aside document", descriptionHi: "दस्तावेज़ को निरस्त करने का मुकदमा", period: 3, periodUnit: "years", category: "Civil" },
  { id: "61", description: "Suit by person barred", descriptionHi: "वर्जित व्यक्ति द्वारा मुकदमा", period: 3, periodUnit: "years", category: "Civil" },
  { id: "62", description: "Suit for compensation for breach of contract", descriptionHi: "अनुबंध भंग के लिए क्षतिपूर्ति का मुकदमा", period: 3, periodUnit: "years", category: "Contract" },
  { id: "63", description: "Suit for account", descriptionHi: "हिसाब का मुकदमा", period: 3, periodUnit: "years", category: "Contract" },
  { id: "64", description: "Suit for compensation for tort", descriptionHi: "अपक्रम (tort) के लिए क्षतिपूर्ति का मुकदमा", period: 3, periodUnit: "years", category: "Tort" },
  { id: "65", description: "Suit for declaration", descriptionHi: "घोषणा का मुकदमा", period: 3, periodUnit: "years", category: "Civil" },
  { id: "66", description: "Suit for injunction", descriptionHi: "निषेधाज्ञा का मुकदमा", period: 3, periodUnit: "years", category: "Civil" },
  { id: "67", description: "Suit for declaration and injunction", descriptionHi: "घोषणा और निषेधाज्ञा का मुकदमा", period: 3, periodUnit: "years", category: "Civil" },
  { id: "68", description: "Suit for possession of movable property", descriptionHi: "चल संपत्ति के कब्जे का मुकदमा", period: 3, periodUnit: "years", category: "Property" },
  { id: "69", description: "Suit for recovery of movable property", descriptionHi: "चल संपत्ति की वसूली का मुकदमा", period: 3, periodUnit: "years", category: "Property" },
  { id: "70", description: "Suit for compensation for negligence", descriptionHi: "लापरवाही के लिए क्षतिपूर्ति का मुकदमा", period: 3, periodUnit: "years", category: "Tort" },
  { id: "71", description: "Suit for compensation for defamation", descriptionHi: "मानहानि के लिए क्षतिपूर्ति का मुकदमा", period: 1, periodUnit: "years", category: "Tort" },
  { id: "72", description: "Suit for compensation for malice", descriptionHi: "दुर्भावना के लिए क्षतिपूर्ति का मुकदमा", period: 1, periodUnit: "years", category: "Tort" },
  { id: "73", description: "Suit for compensation for fraud", descriptionHi: "धोखाधड़ी के लिए क्षतिपूर्ति का मुकदमा", period: 3, periodUnit: "years", category: "Tort" },
  { id: "74", description: "Suit for compensation for mistake", descriptionHi: "भूल के लिए क्षतिपूर्ति का मुकदमा", period: 3, periodUnit: "years", category: "Contract" },
  { id: "75", description: "Suit for compensation for breach of trust", descriptionHi: "विश्वासघात के लिए क्षतिपूर्ति का मुकदमा", period: 3, periodUnit: "years", category: "Contract" },
  { id: "138", description: "Suit for dishonour of cheque", descriptionHi: "चेक अनादरण का मुकदमा", period: 3, periodUnit: "months", category: "Negotiable Instruments" },
  { id: "139", description: "Suit by bank for recovery", descriptionHi: "बैंक द्वारा वसूली का मुकदमा", period: 3, periodUnit: "years", category: "Banking" },
  { id: "140", description: "Suit for recovery of debt", descriptionHi: "ऋण की वसूली का मुकदमा", period: 3, periodUnit: "years", category: "Debt" },
];

export function calculateLimitationExpiry(
  filingDate: Date,
  period: number,
  periodUnit: "days" | "months" | "years"
): Date {
  const base = startOfDay(filingDate);
  switch (periodUnit) {
    case "days":
      return addDays(base, period);
    case "months":
      return addMonths(base, period);
    case "years":
      return addYears(base, period);
  }
}

export function calculateDaysRemaining(expiryDate: Date): number {
  const now = startOfDay(new Date());
  const expiry = startOfDay(expiryDate);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isExpired(expiryDate: Date): boolean {
  return isBefore(startOfDay(expiryDate), startOfDay(new Date()));
}
