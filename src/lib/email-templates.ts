export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function trialStartEmail(userName: string, planName: string, daysLeft: number): EmailTemplate {
  const safeName = escapeHtml(userName);
  const safePlan = escapeHtml(planName);
  return {
    subject: `Welcome to CaseFiles ${planName} - Your ${daysLeft}-Day Trial Has Started`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4f46e5;">Welcome to CaseFiles, ${safeName}!</h1>
        <p>Your <strong>${safePlan}</strong> trial has started and will last for <strong>${daysLeft} days</strong>.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Trial Includes:</h3>
          <ul style="list-style: none; padding: 0;">
            <li>✓ Full access to all ${safePlan} features</li>
            <li>✓ No credit card required</li>
            <li>✓ Cancel anytime</li>
          </ul>
        </div>
        <p>Start by creating your first case or exploring the dashboard.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          If you have any questions, reply to this email or visit our help center.
        </p>
      </div>
    `,
    text: `Welcome to CaseFiles, ${userName}! Your ${planName} trial has started for ${daysLeft} days. Go to ${process.env.NEXT_PUBLIC_APP_URL}/dashboard to get started.`,
  };
}

export function trialExpiringEmail(userName: string, planName: string, daysLeft: number): EmailTemplate {
  const safeName = escapeHtml(userName);
  const safePlan = escapeHtml(planName);
  return {
    subject: `Your CaseFiles ${planName} Trial Ends in ${daysLeft} Day${daysLeft > 1 ? "s" : ""}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #f59e0b;">Trial Ending Soon</h1>
        <p>Hi ${safeName},</p>
        <p>Your <strong>${safePlan}</strong> trial ends in <strong>${daysLeft} day${daysLeft > 1 ? "s" : ""}</strong>.</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0;"><strong>Upgrade now</strong> to keep access to all your data and features.</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=subscription" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Upgrade Now</a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          After your trial ends, your account will be restricted until you subscribe.
        </p>
      </div>
    `,
    text: `Hi ${userName}, your ${planName} trial ends in ${daysLeft} day${daysLeft > 1 ? "s" : ""}. Upgrade at ${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=subscription to keep full access.`,
  };
}

export function trialExpiredEmail(userName: string, planName: string): EmailTemplate {
  const safeName = escapeHtml(userName);
  const safePlan = escapeHtml(planName);
  return {
    subject: `Your CaseFiles ${planName} Trial Has Ended`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #ef4444;">Trial Ended</h1>
        <p>Hi ${safeName},</p>
        <p>Your <strong>${safePlan}</strong> trial has ended. Your account has been restricted.</p>
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0;"><strong>What happens now?</strong></p>
          <ul style="margin: 10px 0 0 0;">
            <li>Your access is limited until you subscribe</li>
            <li>Your data is safe and preserved</li>
            <li>Subscribe anytime to regain full access</li>
          </ul>
        </div>
        <p>Choose a plan that fits your practice and get back to work.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Plans</a>
      </div>
    `,
    text: `Hi ${userName}, your ${planName} trial has ended. Your account is restricted. Subscribe at ${process.env.NEXT_PUBLIC_APP_URL}/pricing to regain access.`,
  };
}

export function subscriptionActivatedEmail(userName: string, planName: string, amount: number): EmailTemplate {
  const safeName = escapeHtml(userName);
  const safePlan = escapeHtml(planName);
  return {
    subject: `CaseFiles ${planName} Subscription Activated`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #10b981;">Subscription Activated!</h1>
        <p>Hi ${safeName},</p>
        <p>Your <strong>${safePlan}</strong> subscription has been activated.</p>
        <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Amount charged:</strong> ₹${amount.toLocaleString("en-IN")}</p>
          <p style="margin: 5px 0 0 0;"><strong>Plan:</strong> ${planName}</p>
        </div>
        <p>You now have full access to all ${safePlan} features.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
      </div>
    `,
    text: `Hi ${userName}, your ${planName} subscription has been activated. Amount charged: ₹${amount.toLocaleString("en-IN")}. Go to ${process.env.NEXT_PUBLIC_APP_URL}/dashboard.`,
  };
}

export function paymentFailedEmail(userName: string, planName: string): EmailTemplate {
  const safeName = escapeHtml(userName);
  const safePlan = escapeHtml(planName);
  return {
    subject: `Payment Failed for CaseFiles ${planName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #ef4444;">Payment Failed</h1>
        <p>Hi ${safeName},</p>
        <p>Your payment for the <strong>${safePlan}</strong> subscription failed.</p>
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0;">Please update your payment method to avoid service interruption.</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Update Payment Method</a>
      </div>
    `,
    text: `Hi ${userName}, your payment for the ${planName} subscription failed. Please update your payment method at ${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing.`,
  };
}
