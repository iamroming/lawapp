import type { DocumentTemplate } from "@/lib/templates";
import { AI_BASE_URL, AI_MODEL } from "./service";

export { LEGAL_DOCUMENT_TYPES, INDIAN_JURISDICTIONS } from "./drafting-constants";

export interface DraftOptions {
  documentType: string;
  jurisdiction: string;
  partyDetails: string;
  facts: string;
  reliefSought: string;
  additionalInstructions: string;
}

export interface DraftResult {
  title: string;
  content: string;
  documentType: string;
  jurisdiction: string;
  generatedAt: string;
}

export interface TemplateCustomizeOptions {
  template: DocumentTemplate;
  fieldData: Record<string, string>;
}

export interface EngagementLetterOptions {
  clientName: string;
  clientAddress: string;
  matterDescription: string;
  feeStructure: string;
  firmName: string;
  advocateName: string;
  jurisdiction: string;
}

async function callAI(prompt: string, systemPrompt: string): Promise<string | null> {
  if (!process.env.AI_API_KEY) return null;

  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("AI call failed:", error);
    return null;
  }
}

export async function generateLegalDraft(options: DraftOptions): Promise<DraftResult> {
  const systemPrompt = `You are an expert Indian legal document drafter. Generate professionally formatted legal documents following Indian legal conventions. Use proper legal language, reference applicable Indian acts and sections when relevant. Format the document with proper headings, numbered paragraphs, and formal legal structure.`;

  const prompt = `Draft a ${options.documentType.replace(/_/g, " ")} for the jurisdiction of ${options.jurisdiction}.

Party Details:
${options.partyDetails || "Not provided"}

Facts of the Case:
${options.facts}

Relief Sought:
${options.reliefSought || "As appropriate under law"}

Additional Instructions:
${options.additionalInstructions || "None"}

Generate the complete legal document with proper formatting, legal language, and structure. Include relevant sections of applicable Indian laws.`;

  const content = await callAI(prompt, systemPrompt);

  if (content) {
    return {
      title: options.documentType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      content,
      documentType: options.documentType,
      jurisdiction: options.jurisdiction,
      generatedAt: new Date().toISOString(),
    };
  }

  // Fallback
  return generateFallbackDraft(options);
}

function generateFallbackDraft(options: DraftOptions): DraftResult {
  const title = options.documentType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const content = `IN THE ${options.jurisdiction.toUpperCase().replace(/_/g, " ")}

${title.toUpperCase()}

BETWEEN:

${options.partyDetails || "[Party Details]"}

AND

[Opposite Party]

MOST RESPECTFULLY SHOWETH:

1. That the applicant/ plaintiff is aggrieved by the actions of the respondent/defendant.

2. That the facts of the matter are as follows:
${options.facts}

3. That the cause of action arose when the respondent/defendant failed to fulfill their obligations.

4. That this Hon'ble Court has jurisdiction to try the present matter.

PRAYER

In view of the above facts and circumstances, it is most respectfully prayed that this Hon'ble Court may be pleased to:

a) ${options.reliefSought || "Pass such order as this Hon'ble Court may deem fit in the interests of justice"};

b) Award costs of this application/suit to the petitioner/plaintiff;

c) Pass such other and further order(s) as this Hon'ble Court may deem fit.

AND FOR THIS ACT OF KINDNESS, THE PETITIONER/PLAINTIFF SHALL, AS IN DUTY BOUND, EVER PRAY.

Date: ${new Date().toLocaleDateString("en-IN")}

_________________________
Advocate for the Petitioner/Plaintiff`;

  return {
    title,
    content,
    documentType: options.documentType,
    jurisdiction: options.jurisdiction,
    generatedAt: new Date().toISOString(),
  };
}

export async function customizeTemplateWithAI(
  options: TemplateCustomizeOptions
): Promise<string> {
  const { template, fieldData } = options;

  const fieldDescriptions = template.fields
    .map((f) => `- ${f.label}: ${fieldData[f.id] || "[Not provided]"}`)
    .join("\n");

  const systemPrompt = `You are an expert Indian legal document drafter. Customize the provided template with the given field data. Maintain the legal structure and format while personalizing it for the specific case.`;

  const prompt = `Customize this legal document template using the provided field data.

Template Name: ${template.name}
Template Content:
${template.content}

Field Data:
${fieldDescriptions}

Generate the customized document with all fields properly filled in. Maintain proper legal formatting and language.`;

  const result = await callAI(prompt, systemPrompt);

  if (result) return result;

  // Fallback: simple template replacement
  let content = template.content;
  for (const field of template.fields) {
    const value = fieldData[field.id] || `[${field.label}]`;
    content = content.replace(new RegExp(`\\{\\{${field.id}\\}\\}`, "g"), value);
  }
  return content;
}

export async function generateEngagementLetter(
  options: EngagementLetterOptions
): Promise<string> {
  const systemPrompt = `You are an expert Indian legal professional. Draft a professional engagement letter between a law firm and a client. Include proper legal language, fee structure, scope of work, and terms of engagement as per Indian legal practice.`;

  const prompt = `Draft a professional engagement letter with the following details:

Law Firm: ${options.firmName || "[Firm Name]"}
Advocate: ${options.advocateName || "[Advocate Name]"}
Client: ${options.clientName}
Client Address: ${options.clientAddress || "Not provided"}
Matter: ${options.matterDescription}
Fee Structure: ${options.feeStructure || "As mutually agreed"}
Jurisdiction: ${options.jurisdiction}

Include sections for:
1. Introduction and scope of engagement
2. Fee structure and payment terms
3. Confidentiality clause
4. Termination provisions
5. Limitation of liability
6. Governing law
7. Signature blocks

Format as a professional legal letter with proper headings and numbered paragraphs.`;

  const result = await callAI(prompt, systemPrompt);

  if (result) return result;

  // Fallback
  return `ENGAGEMENT LETTER

Date: ${new Date().toLocaleDateString("en-IN")}

To,
${options.clientName}
${options.clientAddress || ""}

FROM:
${options.firmName || "[Firm Name]"}
${options.advocateName || "[Advocate Name]"}

RE: Engagement for Legal Services - ${options.matterDescription}

Dear ${options.clientName},

1. SCOPE OF ENGAGEMENT
We are pleased to accept your engagement for legal services in connection with: ${options.matterDescription}.

2. FEE STRUCTURE
${options.feeStructure || "Fees will be billed as mutually agreed upon at the commencement of each阶段 of the matter."}

3. PAYMENT TERMS
Invoices will be issued monthly and are payable within 30 days of receipt.

4. CONFIDENTIALITY
All information shared in connection with this engagement will be treated as strictly confidential.

5. GOVERNING LAW
This engagement letter shall be governed by the laws of India and the jurisdiction of ${options.jurisdiction}.

Please signify your acceptance by signing below.

_________________________
${options.advocateName || "[Advocate Name]"}
${options.firmName || "[Firm Name]"}

ACCEPTED AND AGREED:

_________________________
${options.clientName}
Date: _______________`;
}
