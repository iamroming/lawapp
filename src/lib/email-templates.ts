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

// ============================
// TRIAL FUNNEL EMAILS (5 stages)
// ============================

export function trialFunnelWelcome(userName: string, planName: string): EmailTemplate {
  const safeName = escapeHtml(userName);
  const safePlan = escapeHtml(planName);
  return {
    subject: `Welcome to CaseFiles ${safePlan}! Your 14-day trial starts now`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4f46e5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Welcome to CaseFiles!</h1>
          <p style="margin: 5px 0 0;">Your ${safePlan} trial has started</p>
        </div>
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Hi ${safeName},</p>
          <p>Congratulations! Your <strong>14-day free trial</strong> of <strong>${safePlan}</strong> plan is now active.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #4f46e5;">Get Started in 3 Steps:</h3>
            <ol>
              <li><strong>Create your first case</strong> — Click "New Case" on dashboard</li>
              <li><strong>Add your clients</strong> — Import or add client details</li>
              <li><strong>Schedule a hearing</strong> — Never miss a court date</li>
            </ol>
          </div>
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0;"><strong>Free trial includes:</strong></p>
            <ul style="margin: 10px 0 0 0;">
              <li>Unlimited cases</li>
              <li>WhatsApp hearing reminders</li>
              <li>AI legal research</li>
              <li>GST invoicing</li>
            </ul>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center;">Go to Dashboard →</a>
          <p style="color: #6b7280; font-size: 13px; margin-top: 30px;">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${userName}, welcome to CaseFiles ${planName}! Your 14-day free trial has started. Go to ${process.env.NEXT_PUBLIC_APP_URL}/dashboard to get started.`,
  };
}

export function trialFunnelDay3(userName: string, planName: string, casesCount: number): EmailTemplate {
  const safeName = escapeHtml(userName);
  const safePlan = escapeHtml(planName);
  return {
    subject: `How's your CaseFiles trial going, ${safeName}?`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #7c3aed; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">How's it going?</h1>
          <p style="margin: 5px 0 0;">Day 3 of your trial</p>
        </div>
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Hi ${safeName},</p>
          <p>You're <strong>3 days</strong> into your ${safePlan} trial. Here's your progress:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="font-size: 36px; margin: 0; color: #4f46e5;"><strong>${casesCount}</strong></p>
            <p style="margin: 5px 0 0; color: #6b7280;">Cases Created</p>
          </div>
          ${casesCount === 0 ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0;"><strong>Tip:</strong> Start by creating your first case. It only takes 30 seconds!</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/cases/new" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Create Your First Case →</a>
          ` : `
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0;"><strong>Great job!</strong> You've created ${casesCount} case${casesCount > 1 ? 's' : ''}. Keep going!</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Continue Working →</a>
          `}
        </div>
      </div>
    `,
    text: `Hi ${userName}, you're 3 days into your CaseFiles trial. You've created ${casesCount} cases so far. Keep going at ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  };
}

export function trialFunnelDay7(userName: string, planName: string, casesCount: number): EmailTemplate {
  const safeName = escapeHtml(userName);
  const safePlan = escapeHtml(planName);
  const daysLeft = 7;
  return {
    subject: `Your CaseFiles trial is half over — here's what you'll miss`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Trial Half Over!</h1>
          <p style="margin: 5px 0 0;">${daysLeft} days remaining</p>
        </div>
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Hi ${safeName},</p>
          <p>Your ${safePlan} trial is <strong>half over</strong>. You have <strong>${daysLeft} days left</strong>.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #f59e0b;">Here's what you'll lose after trial:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 5px 0;">❌ WhatsApp hearing reminders</li>
              <li style="padding: 5px 0;">❌ AI legal research</li>
              <li style="padding: 5px 0;">❌ GST invoicing</li>
              <li style="padding: 5px 0;">❌ ${casesCount} cases you've created</li>
            </ul>
          </div>
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Upgrade now</strong> and keep everything. Plans start at just ₹999/month.</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscription" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Upgrade Now →</a>
        </div>
      </div>
    `,
    text: `Hi ${userName}, your CaseFiles trial is half over. ${daysLeft} days left. Upgrade at ${process.env.NEXT_PUBLIC_APP_URL}/subscription to keep your ${casesCount} cases and all features.`,
  };
}

export function trialFunnelDay12(userName: string, planName: string, casesCount: number): EmailTemplate {
  const safeName = escapeHtml(userName);
  const safePlan = escapeHtml(planName);
  const daysLeft = 2;
  return {
    subject: `⚠️ 2 days left — your CaseFiles data is at risk`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⚠️ Trial Ending Soon!</h1>
          <p style="margin: 5px 0 0;">Only ${daysLeft} days left</p>
        </div>
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Hi ${safeName},</p>
          <p style="font-size: 16px;"><strong>Your ${safePlan} trial ends in ${daysLeft} days.</strong></p>
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0;"><strong>What happens after trial ends:</strong></p>
            <ul style="margin: 10px 0 0 0;">
              <li>Your ${casesCount} cases will be locked</li>
              <li>No more WhatsApp reminders</li>
              <li>No more AI research</li>
              <li>Account restricted to basic access</li>
            </ul>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Why lawyers love CaseFiles:</h3>
            <ul>
              <li>Never miss a hearing again</li>
              <li>Automated client reminders</li>
              <li>One-click GST invoices</li>
              <li>AI-powered legal research</li>
            </ul>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscription" style="display: inline-block; background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center;">Upgrade Before It's Too Late →</a>
        </div>
      </div>
    `,
    text: `URGENT: Your CaseFiles trial ends in ${daysLeft} days. Your ${casesCount} cases will be locked. Upgrade now at ${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
  };
}

export function trialFunnelDay14(userName: string, planName: string): EmailTemplate {
  const safeName = escapeHtml(userName);
  const safePlan = escapeHtml(planName);
  return {
    subject: `Your CaseFiles trial has ended — account restricted`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #6b7280; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Trial Ended</h1>
          <p style="margin: 5px 0 0;">Your CaseFiles access has been limited</p>
        </div>
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 8px 8px;">
          <p>Hi ${safeName},</p>
          <p>Your <strong>${safePlan} trial has ended</strong>. Your account has been restricted.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #6b7280;">Your account is now:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 5px 0; color: #ef4444;">❌ Limited to 3 cases</li>
              <li style="padding: 5px 0; color: #ef4444;">❌ No WhatsApp reminders</li>
              <li style="padding: 5px 0; color: #ef4444;">❌ No AI features</li>
              <li style="padding: 5px 0; color: #ef4444;">❌ No team access</li>
            </ul>
          </div>
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0;"><strong>Good news:</strong> Your data is safe. Subscribe anytime to regain full access.</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscription" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Choose a Plan →</a>
            <p style="color: #6b7280; font-size: 13px; margin-top: 15px;">
              Plans start at ₹999/month. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `Hi ${userName}, your CaseFiles trial has ended. Your account is restricted. Subscribe at ${process.env.NEXT_PUBLIC_APP_URL}/subscription to regain access.`,
  };
}
