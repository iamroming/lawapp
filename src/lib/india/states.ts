export interface IndianState {
  code: string;
  name: string;
  nameHi: string;
  type: "state" | "ut";
  capital: string;
  highCourt: string;
}

export const indianStates: IndianState[] = [
  { code: "AP", name: "Andhra Pradesh", nameHi: "आंध्र प्रदेश", type: "state", capital: "Amaravati", highCourt: "High Court of Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh", nameHi: "अरुणाचल प्रदेश", type: "state", capital: "Itanagar", highCourt: "Gauhati High Court" },
  { code: "AS", name: "Assam", nameHi: "असम", type: "state", capital: "Dispur", highCourt: "Gauhati High Court" },
  { code: "BR", name: "Bihar", nameHi: "बिहार", type: "state", capital: "Patna", highCourt: "Patna High Court" },
  { code: "CG", name: "Chhattisgarh", nameHi: "छत्तीसगढ़", type: "state", capital: "Raipur", highCourt: "High Court of Chhattisgarh" },
  { code: "GA", name: "Goa", nameHi: "गोवा", type: "state", capital: "Panaji", highCourt: "Bombay High Court" },
  { code: "GJ", name: "Gujarat", nameHi: "गुजरात", type: "state", capital: "Gandhinagar", highCourt: "Gujarat High Court" },
  { code: "HR", name: "Haryana", nameHi: "हरियाणा", type: "state", capital: "Chandigarh", highCourt: "Punjab and Haryana High Court" },
  { code: "HP", name: "Himachal Pradesh", nameHi: "हिमाचल प्रदेश", type: "state", capital: "Shimla", highCourt: "Himachal Pradesh High Court" },
  { code: "JH", name: "Jharkhand", nameHi: "झारखंड", type: "state", capital: "Ranchi", highCourt: "Jharkhand High Court" },
  { code: "KA", name: "Karnataka", nameHi: "कर्नाटक", type: "state", capital: "Bengaluru", highCourt: "Karnataka High Court" },
  { code: "KL", name: "Kerala", nameHi: "केरल", type: "state", capital: "Thiruvananthapuram", highCourt: "Kerala High Court" },
  { code: "MP", name: "Madhya Pradesh", nameHi: "मध्य प्रदेश", type: "state", capital: "Bhopal", highCourt: "Madhya Pradesh High Court" },
  { code: "MH", name: "Maharashtra", nameHi: "महाराष्ट्र", type: "state", capital: "Mumbai", highCourt: "Bombay High Court" },
  { code: "MN", name: "Manipur", nameHi: "मणिपुर", type: "state", capital: "Imphal", highCourt: "Manipur High Court" },
  { code: "ML", name: "Meghalaya", nameHi: "मेघालय", type: "state", capital: "Shillong", highCourt: "Meghalaya High Court" },
  { code: "MZ", name: "Mizoram", nameHi: "मिज़ोरम", type: "state", capital: "Aizawl", highCourt: "Gauhati High Court" },
  { code: "NL", name: "Nagaland", nameHi: "नागालैंड", type: "state", capital: "Kohima", highCourt: "Gauhati High Court" },
  { code: "OD", name: "Odisha", nameHi: "ओडिशा", type: "state", capital: "Bhubaneswar", highCourt: "Orissa High Court" },
  { code: "PB", name: "Punjab", nameHi: "पंजाब", type: "state", capital: "Chandigarh", highCourt: "Punjab and Haryana High Court" },
  { code: "RJ", name: "Rajasthan", nameHi: "राजस्थान", type: "state", capital: "Jaipur", highCourt: "Rajasthan High Court" },
  { code: "SK", name: "Sikkim", nameHi: "सिक्किम", type: "state", capital: "Gangtok", highCourt: "Sikkim High Court" },
  { code: "TN", name: "Tamil Nadu", nameHi: "तमिल नाडु", type: "state", capital: "Chennai", highCourt: "Madras High Court" },
  { code: "TS", name: "Telangana", nameHi: "तेलंगाना", type: "state", capital: "Hyderabad", highCourt: "Telangana High Court" },
  { code: "TR", name: "Tripura", nameHi: "त्रिपुरा", type: "state", capital: "Agartala", highCourt: "Tripura High Court" },
  { code: "UP", name: "Uttar Pradesh", nameHi: "उत्तर प्रदेश", type: "state", capital: "Lucknow", highCourt: "Allahabad High Court" },
  { code: "UK", name: "Uttarakhand", nameHi: "उत्तराखंड", type: "state", capital: "Dehradun", highCourt: "Uttarakhand High Court" },
  { code: "WB", name: "West Bengal", nameHi: "पश्चिम बंगाल", type: "state", capital: "Kolkata", highCourt: "Calcutta High Court" },
  { code: "AN", name: "Andaman and Nicobar Islands", nameHi: "अंडमान और निकोबार द्वीप समूह", type: "ut", capital: "Port Blair", highCourt: "Calcutta High Court" },
  { code: "CH", name: "Chandigarh", nameHi: "चंडीगढ़", type: "ut", capital: "Chandigarh", highCourt: "Punjab and Haryana High Court" },
  { code: "DD", name: "Dadra and Nagar Haveli and Daman and Diu", nameHi: "ददरा और नगर हवेली और दमन और दीव", type: "ut", capital: "Daman", highCourt: "Gujarat High Court" },
  { code: "DL", name: "Delhi", nameHi: "दिल्ली", type: "ut", capital: "New Delhi", highCourt: "Delhi High Court" },
  { code: "JK", name: "Jammu and Kashmir", nameHi: "जम्मू और कश्मीर", type: "ut", capital: "Srinagar", highCourt: "High Court of Jammu and Kashmir and Ladakh" },
  { code: "LA", name: "Ladakh", nameHi: "लद्दाख", type: "ut", capital: "Leh", highCourt: "High Court of Jammu and Kashmir and Ladakh" },
  { code: "LD", name: "Lakshadweep", nameHi: "लक्षद्वीप", type: "ut", capital: "Kavaratti", highCourt: "Kerala High Court" },
  { code: "PY", name: "Puducherry", nameHi: "पुडुचेरी", type: "ut", capital: "Pondicherry", highCourt: "Madras High Court" },
];

export const indianStatesAndUTs = indianStates.map((s) => ({
  value: s.name,
  label: s.name,
}));

export const highCourts = [
  "Supreme Court of India",
  "Allahabad High Court",
  "Andhra Pradesh High Court",
  "Bombay High Court",
  "Calcutta High Court",
  "Chhattisgarh High Court",
  "Delhi High Court",
  "Gauhati High Court",
  "Gujarat High Court",
  "Himachal Pradesh High Court",
  "Jammu and Kashmir and Ladakh High Court",
  "Jharkhand High Court",
  "Karnataka High Court",
  "Kerala High Court",
  "Madhya Pradesh High Court",
  "Madras High Court",
  "Manipur High Court",
  "Meghalaya High Court",
  "Orissa High Court",
  "Patna High Court",
  "Punjab and Haryana High Court",
  "Rajasthan High Court",
  "Sikkim High Court",
  "Telangana High Court",
  "Tripura High Court",
  "Uttarakhand High Court",
];
