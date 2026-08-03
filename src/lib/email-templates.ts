export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function trialStartEmail(userName: string, planName: string, daysLeft: number): EmailTemplate {
  return {
    subject: `Welcome to LawXP ${planName} - Your ${daysLeft}-Day Trial Has Started`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4f46e5;">Welcome to LawXP, ${userName}!</h1>
        <p>Your <strong>${planName}</strong> trial has started and will last for <strong>${daysLeft} days</strong>.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Trial Includes:</h3>
          <ul style="list-style: none; padding: 0;">
            <li>✓ Full access to all ${planName} features</li>
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
    text: `Welcome to LawXP, ${userName}! Your ${planName} trial has started for ${daysLeft} days. Go to ${process.env.NEXT_PUBLIC_APP_URL}/dashboard to get started.`,
  };
}

export function trialExpiringEmail(userName: string, planName: string, daysLeft: number): EmailTemplate {
  return {
    subject: `Your LawXP ${planName} Trial Ends in ${daysLeft} Day${daysLeft > 1 ? "s" : ""}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #f59e0b;">Trial Ending Soon</h1>
        <p>Hi ${userName},</p>
        <p>Your <strong>${planName}</strong> trial ends in <strong>${daysLeft} day${daysLeft > 1 ? "s" : ""}</strong>.</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0;"><strong>Upgrade now</strong> to keep access to all your data and features.</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=subscription" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Upgrade Now</a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          After your trial ends, you'll be moved to the Free plan with limited features.
        </p>
      </div>
    `,
    text: `Hi ${userName}, your ${planName} trial ends in ${daysLeft} day${daysLeft > 1 ? "s" : ""}. Upgrade at ${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=subscription to keep full access.`,
  };
}

export function trialExpiredEmail(userName: string, planName: string): EmailTemplate {
  return {
    subject: `Your LawXP ${planName} Trial Has Ended`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #ef4444;">Trial Ended</h1>
        <p>Hi ${userName},</p>
        <p>Your <strong>${planName}</strong> trial has ended. You've been moved to the <strong>Free</strong> plan.</p>
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0;"><strong>What happens now?</strong></p>
          <ul style="margin: 10px 0 0 0;">
            <li>You have access to 3 cases and 1 user</li>
            <li>100 MB storage limit</li>
            <li>Basic features only</li>
          </ul>
        </div>
        <p>Upgrade anytime to regain full access to your data and all features.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Plans</a>
      </div>
    `,
    text: `Hi ${userName}, your ${planName} trial has ended. You've been moved to the Free plan (3 cases, 1 user, 100 MB storage). Upgrade at ${process.env.NEXT_PUBLIC_APP_URL}/pricing.`,
  };
}

export function subscriptionActivatedEmail(userName: string, planName: string, amount: number): EmailTemplate {
  return {
    subject: `LawXP ${planName} Subscription Activated`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #10b981;">Subscription Activated!</h1>
        <p>Hi ${userName},</p>
        <p>Your <strong>${planName}</strong> subscription has been activated.</p>
        <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Amount charged:</strong> ₹${amount.toLocaleString("en-IN")}</p>
          <p style="margin: 5px 0 0 0;"><strong>Plan:</strong> ${planName}</p>
        </div>
        <p>You now have full access to all ${planName} features.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
      </div>
    `,
    text: `Hi ${userName}, your ${planName} subscription has been activated. Amount charged: ₹${amount.toLocaleString("en-IN")}. Go to ${process.env.NEXT_PUBLIC_APP_URL}/dashboard.`,
  };
}

export function paymentFailedEmail(userName: string, planName: string): EmailTemplate {
  return {
    subject: `Payment Failed for LawXP ${planName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #ef4444;">Payment Failed</h1>
        <p>Hi ${userName},</p>
        <p>Your payment for the <strong>${planName}</strong> subscription failed.</p>
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0;">Please update your payment method to avoid service interruption.</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Update Payment Method</a>
      </div>
    `,
    text: `Hi ${userName}, your payment for the ${planName} subscription failed. Please update your payment method at ${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing.`,
  };
}
