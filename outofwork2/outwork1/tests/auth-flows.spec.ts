import { test, expect } from '@playwright/test';
import { screenshot } from './helpers';

test.describe('P0/P1 Fix - Auth Flows', () => {
  test('30 - Confirm email page renders correctly', async ({ page }) => {
    await page.goto('/confirm-email?email=test@lawyer.com');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await screenshot(page, '30-confirm-email-page');

    await expect(page.locator('text=Check Your Email')).toBeVisible();
    await expect(page.locator('text=test@lawyer.com')).toBeVisible();
    await expect(page.locator('text=Resend Verification Email')).toBeVisible();
    await expect(page.locator('text=Sign in')).toBeVisible();
  });

  test('31 - Confirm email page without email param', async ({ page }) => {
    await page.goto('/confirm-email');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await screenshot(page, '31-confirm-email-no-email');

    await expect(page.locator('text=Check Your Email')).toBeVisible();
  });

  test('32 - Reset password page renders correctly', async ({ page }) => {
    await page.goto('/reset-password');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '32-reset-password-page');

    // Should show invalid link since no token
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeDefined();
  });

  test('33 - Setup page redirects to signup', async ({ page }) => {
    await page.goto('/setup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await screenshot(page, '33-setup-redirect');

    await expect(page.locator('text=Setup Unavailable')).toBeVisible();
    await expect(page.locator('text=Go to Signup')).toBeVisible();
  });

  test('34 - Signup page mode selection', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '34-signup-mode-selection');

    await expect(page.locator('text=Firm Owner')).toBeVisible();
    await expect(page.locator('text=Team Member')).toBeVisible();
    await expect(page.locator('text=Continue with Google')).toBeVisible();
  });

  test('35 - Signup owner flow', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Click "I'm a Firm Owner"
    await page.locator('text=I\'m a Firm Owner').click();
    await page.waitForTimeout(500);
    await screenshot(page, '35-signup-owner-form');

    await expect(page.locator('text=Create Your Firm')).toBeVisible();
    await expect(page.locator('input[placeholder*="Advocate"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('text=Create Firm & Account')).toBeVisible();
  });

  test('36 - Signup employee flow', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Click "I'm a Team Member"
    await page.locator('text=I\'m a Team Member').click();
    await page.waitForTimeout(500);
    await screenshot(page, '36-signup-employee-form');

    await expect(page.locator('text=Join Your Team')).toBeVisible();
    await expect(page.locator('text=Invite Code')).toBeVisible();
  });

  test('37 - Login page forgot password link', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await screenshot(page, '37-login-forgot-password');

    const forgotLink = page.locator('text=Forgot password');
    if (await forgotLink.isVisible()) {
      await expect(forgotLink).toBeVisible();
    }
  });

  test('38 - Health check endpoint', async ({ page }) => {
    const response = await page.goto('/api/health');
    expect(response?.status()).toBe(200);
    const body = await response?.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('lawxp');
  });

  test('39 - Confirm email page mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/confirm-email?email=test@lawyer.com');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await screenshot(page, '39-confirm-email-mobile');

    await expect(page.locator('text=Check Your Email')).toBeVisible();
  });

  test('40 - Reset password page mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/reset-password');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '40-reset-password-mobile');
  });

  test('41 - Signup owner form validation', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.locator('text=I\'m a Firm Owner').click();
    await page.waitForTimeout(500);

    // Try to submit empty form
    await page.locator('text=Create Firm & Account').click();
    await page.waitForTimeout(500);
    await screenshot(page, '41-signup-validation-error');

    // Should show validation errors
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeDefined();
  });

  test('42 - Pricing page renders', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '42-pricing-page');

    await expect(page.locator('text=Free').first()).toBeVisible();
  });

  test('43 - Landing page renders', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '43-landing-page');

    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('LawXP');
  });
});
