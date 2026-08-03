export interface CaseAnalysis {
  caseId: string;
  caseTitle: string;
  strength: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  keyIssues: string[];
  suggestedStrategies: LegalStrategy[];
  relevantPrecedents: Precedent[];
  summary: string;
  nextSteps: string[];
  estimatedDuration: string;
  potentialOutcome: string;
}

export interface LegalStrategy {
  id: string;
  title: string;
  description: string;
  probability: number;
  estimatedCost: string;
  risks: string[];
  benefits: string[];
}

export interface Precedent {
  id: string;
  caseName: string;
  citation: string;
  court: string;
  year: number;
  relevance: number;
  summary: string;
}

export interface DocumentSummary {
  title: string;
  summary: string;
  keyPoints: string[];
  legalIssues: string[];
  deadlines: string[];
  parties: string[];
}

export interface ResearchQuery {
  query: string;
  act?: string;
  section?: string;
  topic?: string;
}

export interface ResearchResult {
  id: string;
  title: string;
  description: string;
  type: "section" | "case_law" | "opinion" | "article";
  relevance: number;
  source: string;
  url?: string;
}
