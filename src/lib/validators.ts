import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Invalid phone number").max(15),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firmName: z.string().optional(),
  enrollmentNumber: z.string().optional(),
});

export const clientSchema = z.object({
  full_name: z.string().min(2, "Name is required").max(200),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  phone: z.string().min(10, "Invalid phone number").max(15),
  alternate_phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^[0-9]{6}$/, "Invalid pincode").or(z.literal("")).optional(),
  id_type: z.enum(["aadhaar", "pan", "passport", "voter_id", "other"]).optional(),
  id_number: z.string().optional(),
  company_name: z.string().optional(),
  gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST number").or(z.literal("")).optional(),
  notes: z.string().optional(),
});

export const caseSchema = z.object({
  title: z.string().min(3, "Title is required").max(500),
  description: z.string().optional(),
  case_type: z.string().min(1, "Case type is required"),
  court: z.string().optional(),
  court_room: z.string().optional(),
  judge_name: z.string().optional(),
  opposing_party: z.string().optional(),
  opposing_counsel: z.string().optional(),
  client_id: z.string().uuid().optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  filing_date: z.string().optional(),
  total_fee: z.number().min(0).optional(),
});

export const hearingSchema = z.object({
  case_id: z.string().uuid("Select a case"),
  hearing_date: z.string().min(1, "Date is required"),
  purpose: z.string().optional(),
  court: z.string().optional(),
  court_room: z.string().optional(),
  judge_name: z.string().optional(),
  notes: z.string().optional(),
});

export const invoiceSchema = z.object({
  client_id: z.string().uuid().optional().or(z.literal("")),
  case_id: z.string().uuid().optional().or(z.literal("")),
  amount: z.number().min(1, "Amount must be greater than 0"),
  tax_amount: z.number().min(0).optional(),
  gst_rate: z.number().min(0).max(100).optional(),
  description: z.string().optional(),
  due_date: z.string().optional(),
});

export const timeEntrySchema = z.object({
  case_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().min(1, "Description is required"),
  hours: z.number().min(0.5, "Minimum 0.5 hours"),
  rate_per_hour: z.number().min(0).optional(),
  date: z.string().min(1, "Date is required"),
  is_billable: z.boolean().default(true),
});

export const paymentSchema = z.object({
  client_id: z.string().uuid().optional().or(z.literal("")),
  case_id: z.string().uuid().optional().or(z.literal("")),
  amount: z.number().min(1, "Amount must be greater than 0"),
  payment_method: z.enum(["cash", "bank_transfer", "upi", "cheque", "card", "other"]).nullable(),
  payment_date: z.string().min(1, "Date is required"),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

export const documentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  case_id: z.string().uuid().optional().or(z.literal("")),
  category: z.enum(["petition", "affidavit", "evidence", "judgment", "agreement", "correspondence", "other"]).default("other"),
  is_confidential: z.boolean().default(false),
});

export const reminderSchema = z.object({
  case_id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  reminder_date: z.string().min(1, "Date is required"),
  type: z.enum(["hearing", "deadline", "payment", "follow_up", "custom"]).default("custom"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type CaseInput = z.infer<typeof caseSchema>;
export type HearingInput = z.infer<typeof hearingSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type TimeEntryInput = z.infer<typeof timeEntrySchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type ReminderInput = z.infer<typeof reminderSchema>;
