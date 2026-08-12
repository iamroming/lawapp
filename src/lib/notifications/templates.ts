import type { NotificationType } from "./types";

interface EmailTemplate {
  subject: string;
  subjectHi: string;
  html: string;
  htmlHi: string;
}

export const emailTemplates: Record<NotificationType, EmailTemplate> = {
  hearing_reminder: {
    subject: "Hearing Reminder - {{caseTitle}}",
    subjectHi: "सुनवाई अनुस्मारक - {{caseTitle}}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">CaseFiles</h1>
          <p style="margin: 5px 0 0;">Hearing Reminder</p>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Upcoming Hearing</h2>
          <p>You have an upcoming hearing scheduled:</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Case:</strong> {{caseTitle}}</p>
            <p><strong>Case Number:</strong> {{caseNumber}}</p>
            <p><strong>Date:</strong> {{hearingDate}}</p>
            <p><strong>Court:</strong> {{court}}</p>
            <p><strong>Judge:</strong> {{judge}}</p>
          </div>
          <p>Please prepare all necessary documents and arrive at court on time.</p>
        </div>
        <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This is an automated reminder from CaseFiles.</p>
        </div>
      </div>
    `,
    htmlHi: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">लॉ ऐप</h1>
          <p style="margin: 5px 0 0;">सुनवाई अनुस्मारक</p>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>आगामी सुनवाई</h2>
          <p>आपकी एक आगामी सुनवाई निर्धारित है:</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>मामला:</strong> {{caseTitle}}</p>
            <p><strong>मामला संख्या:</strong> {{caseNumber}}</p>
            <p><strong>तारीख:</strong> {{hearingDate}}</p>
            <p><strong>न्यायालय:</strong> {{court}}</p>
            <p><strong>न्यायाधीश:</strong> {{judge}}</p>
          </div>
          <p>कृपया सभी आवश्यक दस्तावेज़ तैयार करें और समय पर न्यायालय में उपस्थित रहें।</p>
        </div>
        <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>यह लॉ ऐप से एक स्वचालित अनुस्मारक है।</p>
        </div>
      </div>
    `,
  },
  payment_due: {
    subject: "Payment Due - {{caseTitle}}",
    subjectHi: "भुगतान देय - {{caseTitle}}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">CaseFiles</h1>
          <p style="margin: 5px 0 0;">Payment Due Alert</p>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Payment Reminder</h2>
          <p>A payment is due for the following case:</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Case:</strong> {{caseTitle}}</p>
            <p><strong>Amount:</strong> {{amount}}</p>
            <p><strong>Due Date:</strong> {{dueDate}}</p>
            <p><strong>Client:</strong> {{clientName}}</p>
          </div>
          <p>Please ensure timely payment to avoid any delays.</p>
        </div>
        <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This is an automated reminder from CaseFiles.</p>
        </div>
      </div>
    `,
    htmlHi: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">लॉ ऐप</h1>
          <p style="margin: 5px 0 0;">भुगतान देय अलर्ट</p>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>भुगतान अनुस्मारक</h2>
          <p>निम्नलिखित मामले के लिए भुगतान देय है:</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>मामला:</strong> {{caseTitle}}</p>
            <p><strong>राशि:</strong> {{amount}}</p>
            <p><strong>देय तिथि:</strong> {{dueDate}}</p>
            <p><strong>ग्राहक:</strong> {{clientName}}</p>
          </div>
          <p>कृपया किसी भी देरी से बचने के लिए समय पर भुगतान सुनिश्चित करें।</p>
        </div>
        <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>यह लॉ ऐप से एक स्वचालित अनुस्मारक है।</p>
        </div>
      </div>
    `,
  },
  payment_received: {
    subject: "Payment Received - {{caseTitle}}",
    subjectHi: "भुगतान प्राप्त - {{caseTitle}}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">CaseFiles</h1>
          <p style="margin: 5px 0 0;">Payment Received</p>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Payment Confirmation</h2>
          <p>A payment has been received:</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Case:</strong> {{caseTitle}}</p>
            <p><strong>Amount:</strong> {{amount}}</p>
            <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
            <p><strong>Client:</strong> {{clientName}}</p>
          </div>
        </div>
        <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from CaseFiles.</p>
        </div>
      </div>
    `,
    htmlHi: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">लॉ ऐप</h1>
          <p style="margin: 5px 0 0;">भुगतान प्राप्त</p>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>भुगतान पुष्टि</h2>
          <p>एक भुगतान प्राप्त हुआ है:</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>मामला:</strong> {{caseTitle}}</p>
            <p><strong>राशि:</strong> {{amount}}</p>
            <p><strong>भुगतान विधि:</strong> {{paymentMethod}}</p>
            <p><strong>ग्राहक:</strong> {{clientName}}</p>
          </div>
        </div>
        <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>यह लॉ ऐप से एक स्वचालित सूचना है।</p>
        </div>
      </div>
    `,
  },
  case_update: {
    subject: "Case Update - {{caseTitle}}",
    subjectHi: "मामला अपडेट - {{caseTitle}}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #7c3aed; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">CaseFiles</h1>
          <p style="margin: 5px 0 0;">Case Update</p>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Case Status Updated</h2>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Case:</strong> {{caseTitle}}</p>
            <p><strong>Status:</strong> {{status}}</p>
            <p><strong>Updated by:</strong> {{updatedBy}}</p>
          </div>
        </div>
        <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from CaseFiles.</p>
        </div>
      </div>
    `,
    htmlHi: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #7c3aed; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">लॉ ऐप</h1>
          <p style="margin: 5px 0 0;">मामला अपडेट</p>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>मामला स्थिति अपडेट</h2>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>मामला:</strong> {{caseTitle}}</p>
            <p><strong>स्थिति:</strong> {{status}}</p>
            <p><strong>द्वारा अपडेट:</strong> {{updatedBy}}</p>
          </div>
        </div>
        <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>यह लॉ ऐप से एक स्वचालित सूचना है।</p>
        </div>
      </div>
    `,
  },
  document_uploaded: {
    subject: "Document Uploaded - {{documentTitle}}",
    subjectHi: "दस्तावेज़ अपलोड - {{documentTitle}}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0891b2; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">CaseFiles</h1>
          <p style="margin: 5px 0 0;">Document Uploaded</p>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>New Document</h2>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Document:</strong> {{documentTitle}}</p>
            <p><strong>Case:</strong> {{caseTitle}}</p>
            <p><strong>Uploaded by:</strong> {{uploadedBy}}</p>
          </div>
        </div>
        <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from CaseFiles.</p>
        </div>
      </div>
    `,
    htmlHi: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0891b2; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">लॉ ऐप</h1>
          <p style="margin: 5px 0 0;">दस्तावेज़ अपलोड</p>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>नया दस्तावेज़</h2>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>दस्तावेज़:</strong> {{documentTitle}}</p>
            <p><strong>मामला:</strong> {{caseTitle}}</p>
            <p><strong>द्वारा अपलोड:</strong> {{uploadedBy}}</p>
          </div>
        </div>
        <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>यह लॉ ऐप से एक स्वचालित सूचना है।</p>
        </div>
      </div>
    `,
  },
  deadline_approaching: {
    subject: "Deadline Approaching - {{caseTitle}}",
    subjectHi: "समय सीमा निकट - {{caseTitle}}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ea580c; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">CaseFiles</h1>
          <p style="margin: 5px 0 0;">Deadline Alert</p>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Deadline Approaching</h2>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Case:</strong> {{caseTitle}}</p>
            <p><strong>Deadline:</strong> {{deadline}}</p>
            <p><strong>Days Remaining:</strong> {{daysRemaining}}</p>
          </div>
          <p>Please take necessary action before the deadline.</p>
        </div>
        <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This is an automated reminder from CaseFiles.</p>
        </div>
      </div>
    `,
    htmlHi: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ea580c; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">लॉ ऐप</h1>
          <p style="margin: 5px 0 0;">समय सीमा अलर्ट</p>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>समय सीमा निकट</h2>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>मामला:</strong> {{caseTitle}}</p>
            <p><strong>समय सीमा:</strong> {{deadline}}</p>
            <p><strong>शेष दिन:</strong> {{daysRemaining}}</p>
          </div>
          <p>कृपया समय सीमा से पहले आवश्यक कार्रवाई करें।</p>
        </div>
        <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>यह लॉ ऐप से एक स्वचालित अनुस्मारक है।</p>
        </div>
      </div>
    `,
  },
  system: {
    subject: "System Notification",
    subjectHi: "सिस्टम सूचना",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4b5563; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">CaseFiles</h1>
          <p style="margin: 5px 0 0;">System Notification</p>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p>{{message}}</p>
          </div>
        </div>
        <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from CaseFiles.</p>
        </div>
      </div>
    `,
    htmlHi: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4b5563; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">लॉ ऐप</h1>
          <p style="margin: 5px 0 0;">सिस्टम सूचना</p>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p>{{message}}</p>
          </div>
        </div>
        <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>यह लॉ ऐप से एक स्वचालित सूचना है।</p>
        </div>
      </div>
    `,
  },
};

export function renderEmailTemplate(
  type: NotificationType,
  data: Record<string, string>,
  language: "en" | "hi" = "en"
): { subject: string; html: string } {
  const template = emailTemplates[type];
  let content = language === "hi" ? template.htmlHi : template.html;
  let subject = language === "hi" ? template.subjectHi : template.subject;

  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    content = content.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
    subject = subject.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
  }

  return { subject, html: content };
}
