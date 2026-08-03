export type NotificationType =
  | "hearing_reminder"
  | "payment_due"
  | "payment_received"
  | "case_update"
  | "document_uploaded"
  | "deadline_approaching"
  | "system";

export type NotificationChannel = "email" | "sms" | "whatsapp" | "push" | "in_app";

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
  hearingReminders: boolean;
  paymentAlerts: boolean;
  caseUpdates: boolean;
  documentAlerts: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  title_hi: string;
  message: string;
  message_hi: string;
  channels: NotificationChannel[];
  read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

export const defaultPreferences: Omit<NotificationPreferences, "userId"> = {
  email: true,
  sms: false,
  whatsapp: false,
  push: true,
  hearingReminders: true,
  paymentAlerts: true,
  caseUpdates: true,
  documentAlerts: true,
};

export const notificationTypeLabels: Record<NotificationType, { en: string; hi: string }> = {
  hearing_reminder: { en: "Hearing Reminder", hi: "सुनवाई अनुस्मारक" },
  payment_due: { en: "Payment Due", hi: "भुगतान देय" },
  payment_received: { en: "Payment Received", hi: "भुगतान प्राप्त" },
  case_update: { en: "Case Update", hi: "मामला अपडेट" },
  document_uploaded: { en: "Document Uploaded", hi: "दस्तावेज़ अपलोड" },
  deadline_approaching: { en: "Deadline Approaching", hi: "समय सीमा निकट" },
  system: { en: "System", hi: "सिस्टम" },
};
