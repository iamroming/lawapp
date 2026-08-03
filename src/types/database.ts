export type UserRole = 'owner' | 'partner' | 'senior_associate' | 'associate' | 'junior_associate' | 'paralegal' | 'intern' | 'office_admin' | 'super_admin' | 'client';

export type PermissionCode =
  | 'firm.manage' | 'firm.view_settings'
  | 'team.invite' | 'team.remove' | 'team.view' | 'team.change_roles'
  | 'cases.view_all' | 'cases.view_assigned' | 'cases.create' | 'cases.edit' | 'cases.delete' | 'cases.assign'
  | 'clients.view_all' | 'clients.view_assigned' | 'clients.create' | 'clients.edit' | 'clients.delete'
  | 'documents.view_all' | 'documents.view_assigned' | 'documents.create' | 'documents.edit' | 'documents.delete'
  | 'invoices.view_all' | 'invoices.view_own' | 'invoices.create' | 'invoices.edit' | 'invoices.delete'
  | 'reports.view_all' | 'reports.view_own' | 'audit_logs.view'
  | 'hearings.view_all' | 'hearings.view_assigned' | 'hearings.manage';

export const ROLE_HIERARCHY: Record<string, number> = {
  owner: 0,
  super_admin: 0,
  partner: 1,
  senior_associate: 2,
  associate: 3,
  junior_associate: 4,
  paralegal: 5,
  intern: 6,
  office_admin: 7,
};

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  owner: 'Owner',
  partner: 'Partner',
  senior_associate: 'Senior Associate',
  associate: 'Associate',
  junior_associate: 'Junior Associate',
  paralegal: 'Paralegal',
  intern: 'Intern',
  office_admin: 'Office Admin',
  super_admin: 'Super Admin',
};
export type CaseStatus = 'pending' | 'active' | 'in-progress' | 'under-trial' | 'won' | 'lost' | 'settled' | 'closed' | 'adjourned' | 'dismissed';
export type CasePriority = 'low' | 'medium' | 'high' | 'urgent';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card' | 'other';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';
export type BillingPeriod = 'monthly' | 'yearly' | 'one_time';
export type DocumentCategory = 'petition' | 'affidavit' | 'evidence' | 'judgment' | 'agreement' | 'correspondence' | 'other';
export type ReminderType = 'hearing' | 'deadline' | 'payment' | 'follow_up' | 'custom';
export type ECourtsCourtType = 'district' | 'high_court' | 'supreme' | 'tribunal';
export type ReminderChannel = 'in_app' | 'email' | 'sms' | 'whatsapp';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  firm_id: string | null;
  enrollment_number: string | null;
  specialization: string[];
  firm_name: string;
  avatar_url: string | null;
  is_active: boolean;
  state?: string;
  created_at: string;
  updated_at: string;
}

export interface FirmMember {
  id: string;
  firm_id: string;
  user_id: string;
  role_id: string;
  invited_by: string | null;
  joined_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: Profile | null;
}

export interface Permission {
  id: string;
  code: string;
  description: string;
  category: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_code: string;
}

export interface Client {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string;
  alternate_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  id_type: string | null;
  id_number: string | null;
  company_name: string | null;
  gst_number: string | null;
  notes: string | null;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  case_type: string;
  court: string | null;
  court_room: string | null;
  judge_name: string | null;
  opposing_party: string | null;
  opposing_counsel: string | null;
  client_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  status: CaseStatus;
  priority: CasePriority;
  filing_date: string | null;
  next_hearing_date: string | null;
  last_hearing_date: string | null;
  total_fee: number;
  amount_received: number;
  outcome: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  client?: Client | null;
  assigned?: Profile | null;
  creator?: Profile | null;
  ecourts?: ECourtsCase | null;
}

export interface Hearing {
  id: string;
  case_id: string;
  hearing_date: string;
  court: string | null;
  court_room: string | null;
  judge_name: string | null;
  purpose: string | null;
  notes: string | null;
  outcome: string | null;
  next_hearing_date: string | null;
  is_completed: boolean;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  case?: Case | null;
}

export interface Document {
  id: string;
  case_id: string | null;
  uploaded_by: string | null;
  title: string;
  description: string | null;
  file_url: string;
  file_path: string | null;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  category: DocumentCategory | null;
  is_confidential: boolean;
  deleted_at: string | null;
  created_at: string;
  case?: Case | null;
  uploader?: Profile | null;
}

export interface TimeEntry {
  id: string;
  case_id: string | null;
  lawyer_id: string | null;
  description: string;
  hours: number;
  rate_per_hour: number | null;
  date: string;
  is_billable: boolean;
  created_at: string;
  case?: Case | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  case_id: string | null;
  client_id: string | null;
  issued_by: string | null;
  amount: number;
  tax_amount: number;
  gst_rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstin: string | null;
  hsncode: string | null;
  place_of_supply: string | null;
  reverse_charge: boolean;
  description: string | null;
  status: InvoiceStatus;
  due_date: string | null;
  paid_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Client | null;
  case?: Case | null;
}

export interface Payment {
  id: string;
  invoice_id: string | null;
  client_id: string | null;
  case_id: string | null;
  amount: number;
  payment_method: PaymentMethod | null;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  received_by: string | null;
  created_at: string;
  client?: Client | null;
  case?: Case | null;
}

export interface Note {
  id: string;
  case_id: string;
  author_id: string | null;
  content: string;
  is_pinned: boolean;
  mentions: string[];
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_by: string | null;
}

export interface Reminder {
  id: string;
  user_id: string;
  case_id: string | null;
  title: string;
  description: string | null;
  reminder_date: string;
  type: ReminderType;
  is_sent: boolean;
  is_read: boolean;
  created_at: string;
  case?: Case | null;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: Profile | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  billing_period: BillingPeriod;
  features: string[];
  max_cases: number;
  max_users: number;
  max_storage_mb: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: SubscriptionStatus;
  starts_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  payment_method: string | null;
  amount_paid: number;
  custom_price: number | null;
  discount_percent: number | null;
  currency: string;
  auto_renew: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan | null;
  user?: Profile | null;
}

export interface SuperAdmin {
  id: string;
  email: string;
  access_level: 'owner' | 'super_admin';
  permissions: string[];
  last_login: string | null;
  created_at: string;
}

export interface PlatformSetting {
  key: string;
  value: unknown;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

// eCourts Integration Types
export interface ECourtsCase {
  id: string;
  case_id: string;
  cnr_number: string;
  court_name: string;
  court_type: ECourtsCourtType;
  state: string | null;
  district: string | null;
  last_synced_at: string | null;
  last_status: string | null;
  last_hearing_date: string | null;
  next_hearing_date: string | null;
  case_stage: string | null;
  judge_name: string | null;
  listing_bench: string | null;
  is_active: boolean;
  sync_errors: unknown[];
  created_at: string;
  updated_at: string;
  case?: Case | null;
}

export interface CauseListEntry {
  id: string;
  ecourts_case_id: string;
  case_id: string | null;
  listing_date: string;
  item_number: string | null;
  court_hall: string | null;
  bench: string | null;
  judge_name: string | null;
  listing_purpose: string | null;
  status: string | null;
  raw_data: unknown;
  created_at: string;
  ecourts_case?: ECourtsCase | null;
  case?: Case | null;
}

export interface ECourtsOrder {
  id: string;
  ecourts_case_id: string;
  case_id: string | null;
  order_date: string;
  order_type: string | null;
  title: string | null;
  summary: string | null;
  pdf_url: string | null;
  raw_data: unknown;
  synced_at: string;
  created_at: string;
}

export interface ECourtsSyncLog {
  id: string;
  ecourts_case_id: string;
  sync_type: 'status' | 'cause_list' | 'orders';
  status: 'success' | 'error' | 'partial';
  error_message: string | null;
  data_before: unknown;
  data_after: unknown;
  created_at: string;
}

// Notification Types
export interface ScheduledReminder {
  id: string;
  user_id: string;
  case_id: string | null;
  client_id: string | null;
  title: string;
  message: string;
  reminder_date: string;
  channels: ReminderChannel[];
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sent_channels: ReminderChannel[];
  failed_channels: ReminderChannel[];
  retry_count: number;
  max_retries: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  case?: Case | null;
  client?: Client | null;
}

export interface WhatsAppLog {
  id: string;
  user_id: string | null;
  client_id: string | null;
  case_id: string | null;
  phone_number: string;
  message_type: string;
  message_content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  error_message: string | null;
  twilio_sid: string | null;
  sent_at: string | null;
  created_at: string;
}

// Trust Account Types
export interface TrustAccount {
  id: string;
  client_id: string;
  case_id: string | null;
  balance: number;
  total_deposited: number;
  total_withdrawn: number;
  status: 'active' | 'frozen' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface TrustTransaction {
  id: string;
  trust_account_id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string | null;
  invoice_id: string | null;
  reference_number: string | null;
  created_by: string | null;
  created_at: string;
}

export interface TDSRecord {
  id: string;
  invoice_id: string;
  client_id: string;
  tds_rate: number;
  tds_amount: number;
  pan_number: string | null;
  quarter: string | null;
  financial_year: string | null;
  form_20_26q_url: string | null;
  status: 'pending' | 'filed' | 'received';
  created_at: string;
}

// Dashboard Types
export interface DashboardStats {
  cases: {
    total: number;
    active: number;
    pending: number;
    by_status: Record<string, number>;
  };
  clients: { total: number };
  revenue: {
    total: number;
    received: number;
    pending: number;
    collection_rate: number;
  };
  billing: {
    total_pending: number;
    total_overdue: number;
    pending_count: number;
    overdue_count: number;
  };
  time: {
    billable_hours: number;
    non_billable_hours: number;
    utilization_rate: number;
  };
  hearings: {
    upcoming: number;
    this_week: number;
    today: number;
  };
  documents: { total: number };
}

// Helper types for Supabase joins
export type CaseWithClient = Case & { client: Client | null };
export type CaseWithDetails = Case & { client: Client | null; assigned: Profile | null; creator: Profile | null };
export type HearingWithCase = Hearing & { case: Case | null };
export type DocumentWithCase = Document & { case: Case | null; uploader: Profile | null };
export type InvoiceWithDetails = Invoice & { client: Client | null; case: Case | null };
export type PaymentWithDetails = Payment & { client: Client | null; case: Case | null };
export type SubscriptionWithPlan = UserSubscription & { plan: SubscriptionPlan | null; user: Profile | null };
