# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-flows.spec.ts >> P0/P1 Fix - Auth Flows >> 30 - Confirm email page renders correctly
- Location: tests\auth-flows.spec.ts:5:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/confirm-email?email=test@lawyer.com
Call log:
  - navigating to "http://localhost:3000/confirm-email?email=test@lawyer.com", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { screenshot } from './helpers';
  3   | 
  4   | test.describe('P0/P1 Fix - Auth Flows', () => {
  5   |   test('30 - Confirm email page renders correctly', async ({ page }) => {
> 6   |     await page.goto('/confirm-email?email=test@lawyer.com');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/confirm-email?email=test@lawyer.com
  7   |     await page.waitForLoadState('networkidle');
  8   |     await page.waitForTimeout(500);
  9   |     await screenshot(page, '30-confirm-email-page');
  10  | 
  11  |     await expect(page.locator('text=Check Your Email')).toBeVisible();
  12  |     await expect(page.locator('text=test@lawyer.com')).toBeVisible();
  13  |     await expect(page.locator('text=Resend Verification Email')).toBeVisible();
  14  |     await expect(page.locator('text=Sign in')).toBeVisible();
  15  |   });
  16  | 
  17  |   test('31 - Confirm email page without email param', async ({ page }) => {
  18  |     await page.goto('/confirm-email');
  19  |     await page.waitForLoadState('networkidle');
  20  |     await page.waitForTimeout(500);
  21  |     await screenshot(page, '31-confirm-email-no-email');
  22  | 
  23  |     await expect(page.locator('text=Check Your Email')).toBeVisible();
  24  |   });
  25  | 
  26  |   test('32 - Reset password page renders correctly', async ({ page }) => {
  27  |     await page.goto('/reset-password');
  28  |     await page.waitForLoadState('networkidle');
  29  |     await page.waitForTimeout(1000);
  30  |     await screenshot(page, '32-reset-password-page');
  31  | 
  32  |     // Should show invalid link since no token
  33  |     const pageContent = await page.textContent('body');
  34  |     expect(pageContent).toBeDefined();
  35  |   });
  36  | 
  37  |   test('33 - Setup page redirects to signup', async ({ page }) => {
  38  |     await page.goto('/setup');
  39  |     await page.waitForLoadState('networkidle');
  40  |     await page.waitForTimeout(500);
  41  |     await screenshot(page, '33-setup-redirect');
  42  | 
  43  |     await expect(page.locator('text=Setup Unavailable')).toBeVisible();
  44  |     await expect(page.locator('text=Go to Signup')).toBeVisible();
  45  |   });
  46  | 
  47  |   test('34 - Signup page mode selection', async ({ page }) => {
  48  |     await page.goto('/signup');
  49  |     await page.waitForLoadState('networkidle');
  50  |     await page.waitForTimeout(1000);
  51  |     await screenshot(page, '34-signup-mode-selection');
  52  | 
  53  |     await expect(page.locator('text=Firm Owner')).toBeVisible();
  54  |     await expect(page.locator('text=Team Member')).toBeVisible();
  55  |     await expect(page.locator('text=Continue with Google')).toBeVisible();
  56  |   });
  57  | 
  58  |   test('35 - Signup owner flow', async ({ page }) => {
  59  |     await page.goto('/signup');
  60  |     await page.waitForLoadState('networkidle');
  61  |     await page.waitForTimeout(500);
  62  | 
  63  |     // Click "I'm a Firm Owner"
  64  |     await page.locator('text=I\'m a Firm Owner').click();
  65  |     await page.waitForTimeout(500);
  66  |     await screenshot(page, '35-signup-owner-form');
  67  | 
  68  |     await expect(page.locator('text=Create Your Firm')).toBeVisible();
  69  |     await expect(page.locator('input[placeholder*="Advocate"]')).toBeVisible();
  70  |     await expect(page.locator('input[type="email"]')).toBeVisible();
  71  |     await expect(page.locator('input[type="password"]')).toBeVisible();
  72  |     await expect(page.locator('text=Create Firm & Account')).toBeVisible();
  73  |   });
  74  | 
  75  |   test('36 - Signup employee flow', async ({ page }) => {
  76  |     await page.goto('/signup');
  77  |     await page.waitForLoadState('networkidle');
  78  |     await page.waitForTimeout(500);
  79  | 
  80  |     // Click "I'm a Team Member"
  81  |     await page.locator('text=I\'m a Team Member').click();
  82  |     await page.waitForTimeout(500);
  83  |     await screenshot(page, '36-signup-employee-form');
  84  | 
  85  |     await expect(page.locator('text=Join Your Team')).toBeVisible();
  86  |     await expect(page.locator('text=Invite Code')).toBeVisible();
  87  |   });
  88  | 
  89  |   test('37 - Login page forgot password link', async ({ page }) => {
  90  |     await page.goto('/login');
  91  |     await page.waitForLoadState('networkidle');
  92  |     await page.waitForTimeout(500);
  93  |     await screenshot(page, '37-login-forgot-password');
  94  | 
  95  |     const forgotLink = page.locator('text=Forgot password');
  96  |     if (await forgotLink.isVisible()) {
  97  |       await expect(forgotLink).toBeVisible();
  98  |     }
  99  |   });
  100 | 
  101 |   test('38 - Health check endpoint', async ({ page }) => {
  102 |     const response = await page.goto('/api/health');
  103 |     expect(response?.status()).toBe(200);
  104 |     const body = await response?.json();
  105 |     expect(body.status).toBe('ok');
  106 |     expect(body.service).toBe('lawxp');
```