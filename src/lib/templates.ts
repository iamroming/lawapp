export interface DocumentTemplate {
  id: string;
  name: string;
  nameHi: string;
  category: "vakalatnama" | "legal_notice" | "affidavit" | "petition" | "agreement" | "criminal" | "family" | "corporate" | "labor" | "constitutional" | "property" | "consumer" | "other";
  description: string;
  descriptionHi: string;
  fields: TemplateField[];
  content: string;
}

export interface TemplateField {
  id: string;
  label: string;
  labelHi: string;
  type: "text" | "textarea" | "date" | "number";
  required: boolean;
  placeholder?: string;
}

export const documentTemplates: DocumentTemplate[] = [
  // ═══════════════════════════════════════════
  // EXISTING TEMPLATES
  // ═══════════════════════════════════════════
  {
    id: "vakalatnama",
    name: "Vakalatnama",
    nameHi: "\u0935\u0915\u093e\u0932\u0924\u0928\u093e\u092e\u093e",
    category: "vakalatnama",
    description: "Authority letter from client to advocate to represent them in court",
    descriptionHi: "\u092e\u0941\u0915\u0926\u092e\u093e \u0938\u0947 \u0935\u0915\u0940\u0932 \u0915\u094b \u0905\u0927\u093f\u0915\u093e\u0930 \u0926\u0947\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u092c\u0939\u0941\u0924\u093e \u092a\u0924\u094d\u0930",
    fields: [
      { id: "client_name", label: "Client Name", labelHi: "\u0915\u0932\u093e\u090f\u0902\u091f \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Enter client's full name" },
      { id: "client_father_name", label: "Father's/Husband's Name", labelHi: "\u092a\u093f\u0924\u093e \u0914\u0930 \u092a\u0924\u093f \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Father's or Husband's name" },
      { id: "client_address", label: "Client Address", labelHi: "\u0915\u0932\u093e\u090f\u0902\u091f \u0915\u093e \u092a\u0924\u093e", type: "textarea", required: true, placeholder: "Full address of the client" },
      { id: "advocate_name", label: "Advocate Name", labelHi: "\u0935\u0915\u0940\u0932 \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Enter advocate's name" },
      { id: "advocate_enrollment", label: "Enrollment Number", labelHi: "\u0928\u093e\u092e\u093e\u0902\u0915\u0928 \u0938\u0902\u0916\u094d\u092f\u093e", type: "text", required: true, placeholder: "Bar Council enrollment number" },
      { id: "court_name", label: "Court Name", labelHi: "\u0928\u094d\u092f\u093e\u092f\u0932\u092f \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Name of the court" },
      { id: "case_number", label: "Case Number", labelHi: "\u092e\u0941\u0915\u0926\u092e\u093e \u0938\u0902\u0916\u094d\u092f\u093e", type: "text", required: false, placeholder: "Case number (if filed)" },
      { id: "opposite_party", label: "Opposite Party Name", labelHi: "\u0935\u093f\u0930\u094b\u0927\u0940 \u092a\u0915\u094d\u0937 \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Name of opposite party" },
      { id: "date", label: "Date", labelHi: "\u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
    ],
    content: `VAKALATNAMA\n\nI/We, {{client_name}}, S/o/D/o/W/o {{client_father_name}}, residing at {{client_address}}, do hereby appoint {{advocate_name}}, Advocate, Enrollment No. {{advocate_enrollment}}, as my/our advocate to appear on my/our behalf in the Court of {{court_name}} in Case No. {{case_number}} filed against {{opposite_party}} and to act, plead, and represent me/us in the said case and all connected proceedings.\n\nI/We hereby authorize the said advocate to file documents, give receipts, take adjournments, and do all other acts as may be necessary for the proper conduct of the case.\n\nThis vakalatnama is given on {{date}}.\n\n_________________________\nSignature of Client\n{{client_name}}`,
  },
  {
    id: "legal_notice",
    name: "Legal Notice",
    nameHi: "\u0915\u093e\u0928\u0942\u0928\u0940 \u0928\u094b\u091f\u093f\u0938",
    category: "legal_notice",
    description: "Legal notice before filing a lawsuit",
    descriptionHi: "\u092e\u0941\u0915\u0926\u092e\u093e \u0926\u093e\u092f\u0930 \u0915\u0930\u0928\u0947 \u0938\u0947 \u092a\u0939\u0932\u0947 \u0915\u093e\u0928\u0942\u0928\u0940 \u0928\u094b\u091f\u093f\u0938",
    fields: [
      { id: "sender_name", label: "Sender Name", labelHi: "\u092d\u0947\u091c\u0928\u0947 \u0935\u093e\u0932\u0947 \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Your client's name" },
      { id: "sender_address", label: "Sender Address", labelHi: "\u092d\u0947\u091c\u0928\u0947 \u0935\u093e\u0932\u0947 \u0915\u093e \u092a\u0924\u093e", type: "textarea", required: true, placeholder: "Your client's address" },
      { id: "recipient_name", label: "Recipient Name", labelHi: "\u092a\u094d\u0930\u093e\u092a\u094d\u0924 \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Name of person receiving notice" },
      { id: "recipient_address", label: "Recipient Address", labelHi: "\u092a\u094d\u0930\u093e\u092a\u094d\u0924 \u0915\u093e \u092a\u0924\u093e", type: "textarea", required: true, placeholder: "Address of recipient" },
      { id: "subject", label: "Subject", labelHi: "\u0935\u093f\u0937\u092f", type: "text", required: true, placeholder: "Subject of the notice" },
      { id: "notice_content", label: "Notice Content", labelHi: "\u0928\u094b\u091f\u093f\u0938 \u0935\u093f\u0937\u092f \u0935\u093f\u0935\u0930\u0923", type: "textarea", required: true, placeholder: "Detailed content of the legal notice" },
      { id: "demand", label: "Demand/Relief Sought", labelHi: "\u092e\u093e\u0902\u0917 / \u0930\u093e\u0939\u0924", type: "textarea", required: true, placeholder: "What you are demanding" },
      { id: "date", label: "Date", labelHi: "\u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
    ],
    content: `LEGAL NOTICE\n\nTo,\n{{recipient_name}}\n{{recipient_address}}\n\nDate: {{date}}\n\nFrom:\n{{sender_name}}\n{{sender_address}}\n\nSUBJECT: {{subject}}\n\nSir/Madam,\n\nI, {{sender_name}}, through my advocate, do hereby serve you with this legal notice under Section 80 of the Code of Civil Procedure, 1908, and/or under other applicable provisions of law.\n\nNOTICE CONTENT:\n{{notice_content}}\n\nDEMAND:\n{{demand}}\n\nYou are hereby called upon to comply with the above demand within 15 days from the date of receipt of this notice, failing which my client shall be constrained to initiate appropriate civil and/or criminal proceedings against you at your risk as to costs and consequences.\n\nThis notice is issued without prejudice to my client's other rights and remedies available under law.\n\nYours faithfully,\n\n_________________________\nAdvocate for {{sender_name}}`,
  },
  {
    id: "affidavit",
    name: "Affidavit",
    nameHi: "\u0939\u0932\u092b\u0928\u093e\u092e\u093e",
    category: "affidavit",
    description: "Sworn statement before a notary or court",
    descriptionHi: "\u0928\u094b\u091f\u0947\u0930\u0940 \u092f\u093e \u0928\u094d\u092f\u093e\u092f\u0932\u092f \u0915\u0947 \u0938\u093e\u092e\u0916\u0947 \u0935\u094d\u0935\u093e\u0915\u0930\u0936\u093f\u0924 \u092c\u092f\u093e\u0928",
    fields: [
      { id: "deponent_name", label: "Deponent Name", labelHi: "\u0939\u0932\u092b\u0928\u093e\u092e\u093e \u0926\u0947\u0928\u0947 \u0935\u093e\u0932\u0947 \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Person making the affidavit" },
      { id: "deponent_father", label: "Father's/Husband's Name", labelHi: "\u092a\u093f\u0924\u093e \u0914\u0930 \u092a\u0924\u093f \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Father's or Husband's name" },
      { id: "deponent_address", label: "Deponent Address", labelHi: "\u0939\u0932\u092b\u0928\u093e\u092e\u093e \u0926\u0947\u0928\u0947 \u0935\u093e\u0932\u0947 \u092a\u0924\u093e", type: "textarea", required: true, placeholder: "Address of the deponent" },
      { id: "affidavit_content", label: "Affidavit Content", labelHi: "\u0939\u0932\u092b\u0928\u093e\u092e\u093e \u0935\u093f\u0937\u092f \u0935\u093f\u0935\u0930\u0923", type: "textarea", required: true, placeholder: "Content of the affidavit" },
      { id: "court_name", label: "Court/Authority", labelHi: "\u0928\u094d\u092f\u093e\u092f\u0932\u092f / \u092a\u094d\u0930\u093e\u0927\u093f\u0915\u093e\u0930\u0940", type: "text", required: false, placeholder: "Court or authority (if applicable)" },
      { id: "date", label: "Date", labelHi: "\u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
    ],
    content: `AFFIDAVIT\n\nI, {{deponent_name}}, S/o/D/o/W/o {{deponent_father}}, residing at {{deponent_address}}, do hereby solemnly affirm and declare as under:\n\n1. That I am the deponent of this affidavit and I am competent to make this affidavit.\n\n2. That the contents of this affidavit are true and correct to the best of my knowledge and belief.\n\n3. That I have not filed any other affidavit on the same subject matter before any other court or authority.\n\n{{affidavit_content}}\n\n4. That nothing material has been concealed from this affidavit.\n\nDEPONENT\n\n{{deponent_name}}\n\nVerification\n\nI, {{deponent_name}}, the above named deponent, do hereby verify that the contents of paragraphs 1 to 4 above are true and correct to the best of my knowledge and belief. No part of it is false and nothing material has been concealed therefrom.\n\nVerified at {{court_name}} on this {{date}}.\n\n_________________________\nDeponent\n\n{{deponent_name}}`,
  },
  {
    id: "civil_plaint",
    name: "Civil Plaint",
    nameHi: "\u0939\u094b\u0938\u0932\u093e \u0926\u093e\u092f\u0930\u093e",
    category: "petition",
    description: "Civil suit plaint for filing in civil courts",
    descriptionHi: "\u0939\u094b\u0938\u0932\u093e \u0928\u094d\u092f\u093e\u092f\u0932\u092f \u092e\u0947\u0902 \u0926\u093e\u092f\u0930\u093e \u0926\u093e\u092f\u0930\u0947 \u0915\u0947 \u0932\u093f\u090f",
    fields: [
      { id: "plaintiff_name", label: "Plaintiff Name", labelHi: "\u0935\u093e\u0926\u0940 \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Name of plaintiff" },
      { id: "defendant_name", label: "Defendant Name", labelHi: "\u0935\u093e\u0926\u0935\u093e \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Name of defendant" },
      { id: "cause_of_action", label: "Cause of Action", labelHi: "\u092e\u0941\u0915\u0926\u092e\u093e \u0915\u093e \u0915\u093e\u0930\u0923", type: "textarea", required: true, placeholder: "Brief facts giving rise to the suit" },
      { id: "relief_sought", label: "Relief Sought", labelHi: "\u092e\u093e\u0902\u0917 \u0935\u093e\u0902\u091c\u093f\u0924", type: "textarea", required: true, placeholder: "What relief you are seeking" },
      { id: "date", label: "Date", labelHi: "\u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
    ],
    content: `IN THE COURT OF {{court_name}}\n\nCIVIL SUIT NO. ______ OF {{year}}\n\n{{plaintiff_name}} .......... PLAINTIFF\nVS.\n{{defendant_name}} .......... DEFENDANT\n\nSUIT FOR {{relief_sought}}\n\nMOST RESPECTFULLY SHOWETH:\n\n1. That the plaintiff is a law-abiding citizen and has filed the present suit against the defendant.\n\n2. That the cause of action arose on {{date}} when {{cause_of_action}}.\n\n3. That the value of the suit for purposes of court fee is Rs. {{court_fee}}/- and for purposes of jurisdiction is Rs. {{jurisdiction_value}}/-.\n\n4. That this Hon'ble Court has jurisdiction to try the present suit.\n\nPRAYER\n\nIn view of the above facts and circumstances, it is most respectfully prayed that this Hon'ble Court may be pleased to:\n\na) Pass a decree in favor of the plaintiff and against the defendant for {{relief_sought}};\n\nb) Award costs of this suit to the plaintiff;\n\nc) Pass such other and further order(s) as this Hon'ble Court may deem fit in the interests of justice.\n\nAND FOR THIS ACT OF KINDNESS, THE PLAINTIFF SHALL, AS IN DUTY BOUND, EVER PRAY.\n\n{{date}}\n\n_________________________\nPlaintiff through Advocate\n{{advocate_name}}`,
  },

  // ═══════════════════════════════════════════
  // CRIMINAL LAW TEMPLATES
  // ═══════════════════════════════════════════
  {
    id: "bail_application",
    name: "Bail Application",
    nameHi: "\u091c\u093e\u092e\u093e\u0928\u0924 \u0905\u0930\u094d\u0925\u0940",
    category: "criminal",
    description: "Anticipatory/Regular bail application under CrPC/BNS",
    descriptionHi: "\u0926\u0902\u0921 / \u0928\u093f\u092f\u092e\u093f\u0924 \u091c\u093e\u092e\u093e\u0928\u0924 \u0905\u0930\u094d\u0925\u0940 CrPC/BNS \u0924\u0939\u0924",
    fields: [
      { id: "applicant_name", label: "Applicant Name", labelHi: "\u0905\u0930\u094d\u0925\u0940 \u0932\u0947\u0928\u0947 \u0935\u093e\u0932\u0947 \u0928\u093e\u092e", type: "text", required: true, placeholder: "Accused person's name" },
      { id: "father_name", label: "Father's Name", labelHi: "\u092a\u093f\u0924\u093e \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Father's name" },
      { id: "address", label: "Address", labelHi: "\u092a\u0924\u093e", type: "textarea", required: true, placeholder: "Full address" },
      { id: "fir_number", label: "FIR Number", labelHi: "FIR \u0938\u0902\u0916\u094d\u092f\u093e", type: "text", required: true, placeholder: "e.g. FIR No. 123/2026" },
      { id: "police_station", label: "Police Station", labelHi: "\u0925\u093e\u0928\u093e", type: "text", required: true, placeholder: "Police station name" },
      { id: "sections", label: "Sections Applied", labelHi: "\u0932\u093e\u0917\u0942 \u0927\u093e\u0930\u093e\u090f\u0902", type: "text", required: true, placeholder: "e.g. Section 302 BNS" },
      { id: "court_name", label: "Court Name", labelHi: "\u0928\u094d\u092f\u093e\u092f\u0932\u092f \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Court name" },
      { id: "grounds", label: "Grounds for Bail", labelHi: "\u091c\u093e\u092e\u093e\u0928\u0924 \u0915\u0947 \u0906\u0927\u093e\u0930", type: "textarea", required: true, placeholder: "Arguments for granting bail" },
      { id: "date", label: "Date", labelHi: "\u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
    ],
    content: `IN THE COURT OF {{court_name}}\n\nBAIL APPLICATION NO. _____ OF {{year}}\n\nIN THE MATTER OF:\n{{applicant_name}}, S/o {{father_name}},\n{{address}}\n\n...........APPLICANT\n\nVERSUS\n\nSTATE OF _______________\n\n...........RESPONDENT\n\nFIR No.: {{fir_number}}\nPolice Station: {{police_station}}\nSections: {{sections}}\n\nAPPLICATION FOR GRANT OF BAIL\n\nMOST RESPECTFULLY SHOWETH:\n\n1. That the applicant has been implicated in the above-noted case falsely.\n\n2. That the FIR {{fir_number}} was lodged at {{police_station}} under {{sections}}.\n\n3. That the applicant is innocent and has not committed any offence.\n\n4. That the applicant has deep roots in the community and is not a flight risk.\n\n5. That the applicant is ready to cooperate with the investigation and shall appear before the investigating officer as and when directed.\n\n6. That the applicant has never been involved in any other criminal case.\n\nGROUNDS FOR BAIL:\n{{grounds}}\n\nPRAYER\n\nIt is, therefore, most respectfully prayed that this Hon'ble Court may be pleased to grant bail to the applicant in the interest of justice.\n\nAnd for this act of kindness, the applicant shall, as in duty bound, ever pray.\n\n{{date}}\n\n_________________________\nAdvocate for Applicant`,
  },
  {
    id: "criminal_complaint",
    name: "Criminal Complaint",
    nameHi: "\u092b\u094c\u091c\u093f\u092f\u093e \u0936\u093f\u0915\u093e\u092f\u0924",
    category: "criminal",
    description: "Criminal complaint under BNSS for private complaints",
    descriptionHi: "BNSS \u0924\u0939\u0924 \u0928\u093f\u091c\u0940 \u0936\u093f\u0915\u093e\u092f\u0924 \u0926\u093e\u092f\u0930 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f",
    fields: [
      { id: "complainant_name", label: "Complainant Name", labelHi: "\u092b\u0930\u093f\u092f\u093e\u0926 \u0926\u0947\u0928\u0947 \u0935\u093e\u0932\u0947 \u0928\u093e\u092e", type: "text", required: true, placeholder: "Complainant's name" },
      { id: "accused_name", label: "Accused Name", labelHi: "\u0906\u0930\u094b\u092a\u0940 \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Accused person's name" },
      { id: "sections", label: "Sections Invoked", labelHi: "\u0932\u093e\u0917\u0942 \u0927\u093e\u0930\u093e\u090f\u0902", type: "text", required: true, placeholder: "e.g. Section 318 BNS" },
      { id: "incident_details", label: "Incident Details", labelHi: "\u0918\u091f\u0928\u093e \u0935\u093f\u0935\u0930\u0923", type: "textarea", required: true, placeholder: "Detailed facts of the incident" },
      { id: "date_of_incident", label: "Date of Incident", labelHi: "\u0918\u091f\u0928\u093e \u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
      { id: "court_name", label: "Court Name", labelHi: "\u0928\u094d\u092f\u093e\u092f\u0932\u092f \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Magistrate court name" },
      { id: "date", label: "Date of Filing", labelHi: "\u0926\u093e\u092f\u0930\u093e \u0926\u093e\u0927\u093c\u0928\u0947 \u0915\u093e \u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
    ],
    content: `IN THE COURT OF {{court_name}}\n\nCOMPLAINT CASE NO. _____ OF {{year}}\n\nCOMPLAINANT: {{complainant_name}}\n\nVERSUS\n\nACCUSED: {{accused_name}}\n\nOFFENCE: {{sections}}\n\nCOMPLAINT UNDER SECTION 223 OF Bharatiya Nagarik Suraksha Sanhita, 2023\n\nMOST RESPECTFULLY SHOWETH:\n\n1. That the complainant is the aggrieved person in this matter.\n\n2. That on {{date_of_incident}}, the accused {{accused_name}} committed the following offence:\n\n{{incident_details}}\n\n3. That the offence falls under {{sections}}.\n\n4. That a written complaint was lodged at the police station but no FIR was registered.\n\n5. That this complaint is being filed within the period of limitation.\n\nPRAYER\n\nIt is, therefore, most respectfully prayed that this Hon'ble Court may be pleased to:\n\na) Take cognizance of the offence;\n\nb) Summon the accused;\n\nc) Pass such other order(s) as deemed fit.\n\n{{date}}\n\n_________________________\nComplainant through Advocate`,
  },

  // ═══════════════════════════════════════════
  // FAMILY LAW TEMPLATES
  // ═══════════════════════════════════════════
  {
    id: "divorce_petition",
    name: "Divorce Petition",
    nameHi: "\u0924\u0932\u093e\u0915 \u092f\u093e\u091a\u093f\u0915 \u0926\u093e\u092f\u0930\u093e",
    category: "family",
    description: "Petition for divorce under Hindu Marriage Act / Special Marriage Act",
    descriptionHi: "\u0939\u093f\u0928\u094d\u0926\u0942 \u0935\u093f\u0935\u093e\u0939 \u0905\u0927\u093f\u0928\u093f\u092f\u092e / \u0935\u093f\u0936\u0947\u0937 \u0935\u093f\u0935\u093e\u0939 \u0905\u0927\u093f\u0928\u093f\u092f\u092e \u0924\u0939\u0924 \u0924\u0932\u093e\u0915 \u092f\u093e\u091a\u093f\u0915",
    fields: [
      { id: "petitioner_name", label: "Petitioner Name", labelHi: "\u092f\u093e\u091a\u093f\u0915 \u0926\u093e\u092f\u0930\u093e \u0926\u0947\u0928\u0947 \u0935\u093e\u0932\u0947 \u0928\u093e\u092e", type: "text", required: true, placeholder: "Petitioner's name" },
      { id: "respondent_name", label: "Respondent Name", labelHi: "\u092a\u094d\u0930\u0924\u093f\u0935\u093e\u0926\u0940 \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Respondent's name" },
      { id: "marriage_date", label: "Date of Marriage", labelHi: "\u0935\u093f\u0935\u093e\u0939 \u0915\u093e \u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
      { id: "marriage_place", label: "Place of Marriage", labelHi: "\u0935\u093f\u0935\u093e\u0939 \u0938\u094d\u0925\u093e\u0928", type: "text", required: true, placeholder: "Where marriage took place" },
      { id: "grounds", label: "Grounds for Divorce", labelHi: "\u0924\u0932\u093e\u0915 \u0915\u0947 \u0906\u0927\u093e\u0930", type: "textarea", required: true, placeholder: "e.g. cruelty, desertion, adultery" },
      { id: "facts", label: "Facts of the Case", labelHi: "\u092e\u093e\u092e\u0932\u0947 \u0915\u0947 \u0924\u0925\u094d\u092f", type: "textarea", required: true, placeholder: "Detailed facts supporting the petition" },
      { id: "relief", label: "Relief Sought", labelHi: "\u092e\u093e\u0902\u0917", type: "textarea", required: true, placeholder: "Divorce, alimony, custody, etc." },
      { id: "court_name", label: "Court Name", labelHi: "\u0928\u094d\u092f\u093e\u092f\u0932\u092f \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Family Court name" },
      { id: "date", label: "Date", labelHi: "\u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
    ],
    content: `IN THE COURT OF {{court_name}}\n\nPETITION NO. _____ OF {{year}}\n\nIN THE MATTER OF:\n{{petitioner_name}} .... PETITIONER\n\nVERSUS\n\n{{respondent_name}} .... RESPONDENT\n\nPETITION FOR DISSOLUTION OF MARRIAGE\n\nUNDER THE HINDU MARRIAGE ACT, 1955 / SPECIAL MARRIAGE ACT, 1954\n\nMOST RESPECTFULLY SHOWETH:\n\n1. That the marriage between the petitioner and the respondent was solemnized on {{marriage_date}} at {{marriage_place}}.\n\n2. That after marriage, the respondent has treated the petitioner with cruelty and has deserted the petitioner.\n\n3. That the grounds for divorce are:\n{{grounds}}\n\n4. That the facts supporting this petition are:\n{{facts}}\n\nPRAYER\n\nIn view of the above, it is most respectfully prayed that this Hon'ble Court may be pleased to:\n\na) Dissolve the marriage between the parties;\n\nb) Grant {{relief}};\n\n{{date}}\n\n_________________________\nPetitioner through Advocate`,
  },
  {
    id: "child_custody",
    name: "Child Custody Petition",
    nameHi: "\u092c\u093e\u0932 \u0939\u093e\u0930\u0938\u093e \u092f\u093e\u091a\u093f\u0915 \u0926\u093e\u092f\u0930\u093e",
    category: "family",
    description: "Child custody petition under Guardian and Wards Act",
    descriptionHi: "\u0938\u092e\u093e\u092d\u094d\u0932\u093e\u0915\u094d\u0937\u0915 \u0914\u0930 \u0938\u0935\u094d\u0927\u0940\u0915\u0930\u0923 \u0905\u0927\u093f\u0928\u093f\u092f\u092e \u0924\u0939\u0924 \u092c\u093e\u0932 \u0939\u093e\u0930\u0938\u093e",
    fields: [
      { id: "applicant_name", label: "Applicant Name", labelHi: "\u0905\u0930\u094d\u0925\u0940 \u0932\u0947\u0928\u0947 \u0935\u093e\u0932\u0947 \u0928\u093e\u092e", type: "text", required: true, placeholder: "Parent seeking custody" },
      { id: "child_name", label: "Child's Name", labelHi: "\u092c\u093e\u0932 \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Child's name" },
      { id: "child_age", label: "Child's Age", labelHi: "\u092c\u093e\u0932 \u0915\u0940 \u0909\u092e\u094d\u0930", type: "number", required: true, placeholder: "Age in years" },
      { id: "other_parent", label: "Other Parent Name", labelHi: "\u0905\u0928\u094d\u092f \u092a\u0930\u0947\u0902\u091f \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Other parent's name" },
      { id: "grounds", label: "Grounds for Custody", labelHi: "\u0939\u093e\u0930\u0938\u093e \u0915\u0947 \u0906\u0927\u093e\u0930", type: "textarea", required: true, placeholder: "Why you should get custody" },
      { id: "court_name", label: "Court Name", labelHi: "\u0928\u094d\u092f\u093e\u092f\u0932\u092f \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Family Court name" },
      { id: "date", label: "Date", labelHi: "\u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
    ],
    content: `IN THE COURT OF {{court_name}}\n\nPETITION NO. _____ OF {{year}}\n\nIN THE MATTER OF:\n{{applicant_name}} .... PETITIONER\n\nVERSUS\n\n{{other_parent}} .... RESPONDENT\n\nPETITION FOR CUSTODY OF MINOR CHILD\n\nUNDER THE GUARDIANS AND WARDS ACT, 1890\n\nMOST RESPECTFULLY SHOWETH:\n\n1. That the petitioner is the natural guardian of the minor child {{child_name}}, aged {{child_age}} years.\n\n2. That the child is presently in the custody of the respondent {{other_parent}}.\n\n3. That the petitioner is more suitable to have custody of the child because:\n{{grounds}}\n\n4. That it is in the best interest and welfare of the minor child to be with the petitioner.\n\nPRAYER\n\nIt is most respectfully prayed that this Hon'ble Court may be pleased to grant custody of the minor child {{child_name}} to the petitioner.\n\n{{date}}\n\n_________________________\nPetitioner through Advocate`,
  },

  // ═══════════════════════════════════════════
  // CORPORATE LAW TEMPLATES
  // ═══════════════════════════════════════════
  {
    id: "shareholder_agreement",
    name: "Shareholders Agreement",
    nameHi: "\u0936\u0947\u092f\u0930\u0924\u093e \u0938\u092e\u094d\u0927\u093e\u0928",
    category: "corporate",
    description: "Agreement between shareholders of a company",
    descriptionHi: "\u0915\u0902\u092a\u0928\u0940 \u0915\u0947 \u0936\u0947\u092f\u0930\u0924\u093e\u0913\u0902 \u0915\u0947 \u092c\u0940\u091a \u0938\u092e\u094d\u0927\u093e\u0928",
    fields: [
      { id: "company_name", label: "Company Name", labelHi: "\u0915\u0902\u092a\u0928\u0940 \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Company name" },
      { id: "party_a", label: "Shareholder 1", labelHi: "\u0936\u0947\u092f\u0930\u0924\u093e 1", type: "text", required: true, placeholder: "First shareholder" },
      { id: "party_b", label: "Shareholder 2", labelHi: "\u0936\u0947\u092f\u0930\u0924\u093e 2", type: "text", required: true, placeholder: "Second shareholder" },
      { id: "shares_a", label: "Shares - Party A (%)", labelHi: "\u0936\u0947\u092f\u0930 - \u092a\u0915\u094d\u0937 A (%)", type: "text", required: true, placeholder: "e.g. 60%" },
      { id: "shares_b", label: "Shares - Party B (%)", labelHi: "\u0936\u0947\u092f\u0930 - \u092a\u0915\u094d\u0937 B (%)", type: "text", required: true, placeholder: "e.g. 40%" },
      { id: "terms", label: "Key Terms", labelHi: "\u092e\u0941\u0916\u094d\u092f \u0936\u0930\u094d\u0924\u0947", type: "textarea", required: true, placeholder: "Key terms of the agreement" },
      { id: "date", label: "Date", labelHi: "\u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
    ],
    content: `SHAREHOLDERS AGREEMENT\n\nThis Agreement is made on {{date}}\n\nBETWEEN\n\n1. {{party_a}} (holding {{shares_a}} shares)\nAND\n2. {{party_b}} (holding {{shares_b}} shares)\n\nOF {{company_name}}\n\nWHEREAS the parties are shareholders of {{company_name}};\n\nNOW THIS AGREEMENT WITNESSES AS UNDER:\n\n1. SHAREHOLDING: Party A holds {{shares_a}} and Party B holds {{shares_b}} of the total shares.\n\n2. KEY TERMS:\n{{terms}}\n\n3. MANAGEMENT: Both parties shall have equal say in the management of the company.\n\n4. DIVIDENDS: Dividends shall be declared by mutual agreement.\n\n5. DISPUTE RESOLUTION: Any dispute shall be resolved by arbitration.\n\nIN WITNESS WHEREOF the parties have executed this Agreement on {{date}}.\n\n_________________________\n{{party_a}}\n\n_________________________\n{{party_b}}`,
  },
  {
    id: "board_resolution",
    name: "Board Resolution",
    nameHi: "\u092c\u094b\u0930\u094d\u0921 \u0938\u0902\u0915\u0932\u094d\u0937\u0923",
    category: "corporate",
    description: "Resolution passed at a Board of Directors meeting",
    descriptionHi: "\u0928\u093f\u0930\u094d\u0926\u0947\u0936\u0915 \u092e\u0941\u0916\u094d\u092f\u0932\u094b\u0915\u094d\u0937 \u092e\u0947\u0902 \u092a\u093e\u0938\u093e \u0938\u0902\u0915\u0932\u094d\u0937\u0923",
    fields: [
      { id: "company_name", label: "Company Name", labelHi: "\u0915\u0902\u092a\u0928\u0940 \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Company name" },
      { id: "meeting_date", label: "Meeting Date", labelHi: "\u092c\u0948\u0920\u0915 \u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
      { id: "resolution_text", label: "Resolution Text", labelHi: "\u0938\u0902\u0915\u0932\u094d\u0937\u0923 \u0935\u093f\u0937\u092f", type: "textarea", required: true, placeholder: "Text of the resolution" },
      { id: "chairperson", label: "Chairperson", labelHi: "\u0905\u0927\u094d\u092f\u0915\u094d\u0937", type: "text", required: true, placeholder: "Chairperson name" },
      { id: "date", label: "Date", labelHi: "\u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
    ],
    content: `BOARD RESOLUTION\n\n{{company_name}}\n\nDate of Meeting: {{meeting_date}}\n\nRESOLUTION PASSED AT THE MEETING OF THE BOARD OF DIRECTORS\n\nRESOLVED THAT:\n\n{{resolution_text}}\n\nRESOLVED FURTHER THAT {{chairperson}}, Chairperson/Director, is authorized to sign and execute all documents and do all acts and things as may be necessary to give effect to this resolution.\n\nThis resolution was passed unanimously.\n\n_________________________\n{{chairperson}}\nChairperson\n\nDate: {{date}}`,
  },

  // ═══════════════════════════════════════════
  // LABOR LAW TEMPLATES
  // ═══════════════════════════════════════════
  {
    id: "labor_demand_petition",
    name: "Labor Demand Petition",
    nameHi: "\u0936\u094d\u0930\u092e\u093f\u0915 \u092e\u093e\u0902\u0917 \u092f\u093e\u091a\u093f\u0915",
    category: "labor",
    description: "Demand petition for unpaid wages under Labor Laws",
    descriptionHi: "\u0936\u094d\u0930\u092e\u093f\u0915 \u0915\u093e\u0928\u0942\u0928\u094b\u0902 \u0924\u0939\u0924 \u092c\u0915\u093e\u092f\u093e \u092e\u093e\u0902\u0917 \u092f\u093e\u091a\u093f\u0915",
    fields: [
      { id: "worker_name", label: "Worker Name", labelHi: "\u0936\u094d\u0930\u092e\u093f\u0915 \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Worker/employee name" },
      { id: "employer_name", label: "Employer Name", labelHi: "\u0928\u094b\u0915\u0930 \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Employer/company name" },
      { id: "designation", label: "Designation", labelHi: "\u092a\u0926\u0928\u0924\u093e", type: "text", required: true, placeholder: "Job title/designation" },
      { id: "wages_due", label: "Wages Due (Rs.)", labelHi: "\u092c\u0915\u093e\u092f\u093e \u0930\u093e\u0936\u0940 (Rs.)", type: "number", required: true, placeholder: "Total unpaid amount" },
      { id: "period", label: "Period of Unpaid Wages", labelHi: "\u092c\u0915\u093e\u092f\u093e \u0905\u0935\u0927\u093f \u0915\u093e \u0938\u092e\u092f \u092e\u0947\u0902", type: "text", required: true, placeholder: "e.g. Jan 2026 - Jun 2026" },
      { id: "court_name", label: "Court/Authority", labelHi: "\u0928\u094d\u092f\u093e\u092f\u0932\u092f / \u092a\u094d\u0930\u093e\u0927\u093f\u0915\u093e\u0930\u0940", type: "text", required: true, placeholder: "Labor Court / Authority" },
      { id: "date", label: "Date", labelHi: "\u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
    ],
    content: `IN THE COURT OF {{court_name}}\n\nPETITION NO. _____ OF {{year}}\n\n{{worker_name}} .... PETITIONER\n\nVERSUS\n\n{{employer_name}} .... RESPONDENT\n\nPETITION FOR RECOVERY OF UNPAID WAGES\n\nUNDER THE MINIMUM WAGES ACT, 1948 / CODE ON WAGES, 2019\n\nMOST RESPECTFULLY SHOWETH:\n\n1. That the petitioner was employed as {{designation}} with the respondent.\n\n2. That the petitioner has not been paid wages for the period {{period}}.\n\n3. That the total amount of unpaid wages is Rs. {{wages_due}}/-.\n\n4. That despite repeated demands, the respondent has failed to pay the said wages.\n\nPRAYER\n\nIt is most respectfully prayed that this Hon'ble Court may be pleased to direct the respondent to pay Rs. {{wages_due}}/- along with interest and costs.\n\n{{date}}\n\n_________________________\nPetitioner through Advocate`,
  },

  // ═══════════════════════════════════════════
  // CONSTITUTIONAL LAW TEMPLATES
  // ═══════════════════════════════════════════
  {
    id: "writ_petition",
    name: "Writ Petition (Article 226/32)",
    nameHi: "\u0930\u093f\u091f \u092f\u093e\u091a\u093f\u0915 (Article 226/32)",
    category: "constitutional",
    description: "Writ petition under Article 226 (HC) or Article 32 (SC)",
    descriptionHi: "Article 226 (\u0939\u093e\u0902\u0915\u094b\u091f \u0928\u094d\u092f\u093e\u092f\u0932\u092f) \u092f\u093e 32 (\u0938\u0941\u092a\u094d\u0930\u0940\u092e \u0928\u094d\u092f\u093e\u092f\u0932\u092f) \u0924\u0939\u0924 \u0930\u093f\u091f \u092f\u093e\u091a\u093f\u0915",
    fields: [
      { id: "petitioner_name", label: "Petitioner Name", labelHi: "\u092f\u093e\u091a\u093f\u0915 \u0926\u093e\u092f\u0930\u093e \u0926\u0947\u0928\u0947 \u0935\u093e\u0932\u0947 \u0928\u093e\u092e", type: "text", required: true, placeholder: "Petitioner's name" },
      { id: "respondent_name", label: "Respondent (State/Authority)", labelHi: "\u092a\u094d\u0930\u0924\u093f\u0935\u093e\u0926\u0940 (\u0930\u093e\u091c\u094d\u092f/\u092a\u094d\u0930\u093e\u0927\u093f\u0915\u093e\u0930\u0940)", type: "text", required: true, placeholder: "State or Authority name" },
      { id: "fundamental_right", label: "Fundamental Right Violated", labelHi: "\u092e\u094c\u0932\u093f\u0915 \u0905\u0927\u093f\u0915\u093e\u0930 \u0939\u0928", type: "text", required: true, placeholder: "e.g. Article 21 - Right to Life" },
      { id: "facts", label: "Facts of the Case", labelHi: "\u092e\u093e\u092e\u0932\u0947 \u0915\u0947 \u0924\u0925\u094d\u092f", type: "textarea", required: true, placeholder: "Detailed facts" },
      { id: "writ_type", label: "Type of Writ", labelHi: "\u0930\u093f\u091f \u0915\u093e \u092a\u094d\u0930\u0915\u093e\u0930", type: "text", required: true, placeholder: "Habeas Corpus / Mandamus / Certiorari / Quo Warranto" },
      { id: "relief", label: "Relief Sought", labelHi: "\u092e\u093e\u0902\u0917", type: "textarea", required: true, placeholder: "What you are seeking" },
      { id: "court_name", label: "Court Name", labelHi: "\u0928\u094d\u092f\u093e\u092f\u0932\u092f \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "High Court / Supreme Court" },
      { id: "date", label: "Date", labelHi: "\u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
    ],
    content: `IN THE {{court_name}}\n\nWRIT PETITION NO. _____ OF {{year}}\n\n{{petitioner_name}} .... PETITIONER\n\nVERSUS\n\n{{respondent_name}} .... RESPONDENT\n\nWRIT PETITION UNDER ARTICLE 226/32 OF THE CONSTITUTION OF INDIA\n\nMOST RESPECTFULLY SHOWETH:\n\n1. That the petitioner's fundamental right under {{fundamental_right}} has been violated.\n\n2. That the facts of the case are:\n{{facts}}\n\n3. That the respondent has acted illegally and without jurisdiction.\n\n4. That the appropriate remedy is by way of {{writ_type}}.\n\nPRAYER\n\nIt is most respectfully prayed that this Hon'ble Court may be pleased to:\n\na) Issue a writ of {{writ_type}};\n\nb) Direct the respondent to {{relief}};\n\nc) Pass such other order(s) as deemed fit.\n\n{{date}}\n\n_________________________\nPetitioner through Advocate`,
  },

  // ═══════════════════════════════════════════
  // PROPERTY LAW TEMPLATES
  // ═══════════════════════════════════════════
  {
    id: "sale_deed",
    name: "Sale Deed / Agreement to Sell",
    nameHi: "\u092c\u0947\u0936\u093e \u092a\u0924\u094d\u0930 / \u0935\u093f\u0915\u094d\u0930\u0940 \u0938\u092e\u094d\u0927\u093e\u0928",
    category: "property",
    description: "Agreement for sale of immovable property",
    descriptionHi: "\u0938\u094d\u0925\u093e\u0935\u0930\u091c\u092f \u0938\u0902\u092a\u0924\u094d\u0930 \u0915\u0940 \u092c\u093f\u0915\u094d\u0930\u0940 \u092a\u0924\u094d\u0930",
    fields: [
      { id: "seller_name", label: "Seller Name", labelHi: "\u0935\u093f\u0915\u094d\u0930\u0947\u0924\u093e \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Seller's name" },
      { id: "buyer_name", label: "Buyer Name", labelHi: "\u0915\u094d\u0930\u0947\u0924\u093e \u0915\u093e \u0928\u093e\u092e", type: "text", required: true, placeholder: "Buyer's name" },
      { id: "property_description", label: "Property Description", labelHi: "\u0938\u0902\u092a\u0924\u094d\u0930 \u0935\u093f\u0935\u0930\u0923", type: "textarea", required: true, placeholder: "Full property description with survey number" },
      { id: "sale_amount", label: "Sale Amount (Rs.)", labelHi: "\u092c\u093f\u0915\u094d\u0930\u0940 \u0930\u093e\u0936\u0940 (Rs.)", type: "number", required: true, placeholder: "Total sale consideration" },
      { id: "token_amount", label: "Token Amount (Rs.)", labelHi: "\u091f\u094b\u0915\u0928 \u0930\u093e\u0936\u0940 (Rs.)", type: "number", required: false, placeholder: "Advance/token amount" },
      { id: "date", label: "Date", labelHi: "\u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
    ],
    content: `AGREEMENT TO SELL / SALE DEED\n\nDate: {{date}}\n\nBETWEEN\n\n1. {{seller_name}} (Seller/Vendor)\nAND\n2. {{buyer_name}} (Buyer/Vendee)\n\nPROPERTY:\n{{property_description}}\n\n1. That the seller is the absolute owner of the above-described property.\n\n2. That the seller has agreed to sell and the buyer has agreed to purchase the said property for a total consideration of Rs. {{sale_amount}}/-.\n\n3. That the buyer has paid Rs. {{token_amount}}/- as token/advance amount.\n\n4. That the balance amount of Rs. {{balance}}/- shall be paid at the time of registration.\n\n5. That the seller shall execute the sale deed and get it registered within {{days}} days.\n\nIN WITNESS WHEREOF the parties have signed on {{date}}.\n\n_________________________\n{{seller_name}} (Seller)\n\n_________________________\n{{buyer_name}} (Buyer)`,
  },

  // ═══════════════════════════════════════════
  // CONSUMER LAW TEMPLATES
  // ═══════════════════════════════════════════
  {
    id: "consumer_complaint",
    name: "Consumer Complaint",
    nameHi: "\u0917\u094d\u0930\u093e\u0939\u0915 \u0936\u093f\u0915\u093e\u092f\u0924",
    category: "consumer",
    description: "Consumer complaint before District/State/National Commission",
    descriptionHi: "\u091c\u093f\u0932\u093e / \u0930\u093e\u091c\u094d\u092f / \u0930\u093e\u0937\u094d\u091f\u094d\u0930\u0940य \u0906\u092f\u094b\u0917 \u092a\u0932\u094b\u091f \u0938\u092e\u0915\u094d\u0937 \u0915\u0947 \u0938\u093e\u092e\u0916\u0947 \u0917\u094d\u0930\u093e\u0939\u0915 \u0936\u093f\u0915\u093e\u092f\u0924",
    fields: [
      { id: "complainant_name", label: "Complainant Name", labelHi: "\u092b\u0930\u093f\u092f\u093e\u0926 \u0926\u0947\u0928\u0947 \u0935\u093e\u0932\u0947 \u0928\u093e\u092e", type: "text", required: true, placeholder: "Consumer's name" },
      { id: "opposite_party", label: "Opposite Party (Company/Seller)", labelHi: "\u0935\u093f\u0930\u094b\u0927\u0940 \u092a\u0915\u094d\u0937 (\u0915\u0902\u092a\u0928\u0940/\u0935\u093f\u0915\u094d\u0930\u0947\u0924\u093e)", type: "text", required: true, placeholder: "Company or seller name" },
      { id: "product_service", label: "Product/Service", labelHi: "\u0909\u0924\u094d\u092a\u093e\u0926/\u0938\u0947\u0935\u093e", type: "text", required: true, placeholder: "Product or service purchased" },
      { id: "deficiency", label: "Deficiency in Service/Goods", labelHi: "\u0938\u0947\u0935\u093e/\u0935\u0938\u094d\u0924\u0941 \u092e\u0947\u0902 \u0915\u093e\u092e\u0940", type: "textarea", required: true, placeholder: "What was deficient" },
      { id: "amount_claimed", label: "Amount Claimed (Rs.)", labelHi: "\u0926\u093e\u0935\u093e \u0926\u093e\u0935\u093e (Rs.)", type: "number", required: true, placeholder: "Compensation amount claimed" },
      { id: "forum", label: "Consumer Forum", labelHi: "\u0917\u094d\u0930\u093e\u0939\u0915 \u092b\u094b\u0930\u092e", type: "text", required: true, placeholder: "District/State/National Commission" },
      { id: "date", label: "Date", labelHi: "\u0924\u093e\u0930\u0940\u0916", type: "date", required: true },
    ],
    content: `BEFORE THE {{forum}}\n\nCONSUMER COMPLAINT NO. _____ OF {{year}}\n\n{{complainant_name}} .... COMPLAINANT\n\nVERSUS\n\n{{opposite_party}} .... OPPOSITE PARTY\n\nCOMPLAINT UNDER THE CONSUMER PROTECTION ACT, 2019\n\nMOST RESPECTFULLY SHOWETH:\n\n1. That the complainant purchased {{product_service}} from the opposite party.\n\n2. That there is a deficiency in service/goods:\n{{deficiency}}\n\n3. That the complainant has suffered a loss of Rs. {{amount_claimed}}/-.\n\n4. That despite making a complaint to the opposite party, no relief was provided.\n\nPRAYER\n\nIt is most respectfully prayed that this Hon'ble Commission may be pleased to:\n\na) Direct the opposite party to pay Rs. {{amount_claimed}}/-;\n\nb) Award costs of litigation;\n\nc) Pass such other order(s) as deemed fit.\n\n{{date}}\n\n_________________________\nComplainant through Advocate`,
  },
];

export function getTemplatesByCategory(category: DocumentTemplate["category"]): DocumentTemplate[] {
  return documentTemplates.filter((t) => t.category === category);
}

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return documentTemplates.find((t) => t.id === id);
}

export function generateDocument(template: DocumentTemplate, data: Record<string, string>): string {
  let content = template.content;
  for (const field of template.fields) {
    const value = data[field.id] || `[${field.label}]`;
    content = content.replace(new RegExp(`\\{\\{${field.id}\\}\\}`, "g"), value);
  }
  return content;
}
