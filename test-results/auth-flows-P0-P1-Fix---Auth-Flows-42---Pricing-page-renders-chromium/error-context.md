# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-flows.spec.ts >> P0/P1 Fix - Auth Flows >> 42 - Pricing page renders
- Location: tests\auth-flows.spec.ts:145:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/pricing
Call log:
  - navigating to "http://localhost:3000/pricing", waiting until "load"

```

# Test source

```ts
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
  107 |   });
  108 | 
  109 |   test('39 - Confirm email page mobile view', async ({ page }) => {
  110 |     await page.setViewportSize({ width: 375, height: 812 });
  111 |     await page.goto('/confirm-email?email=test@lawyer.com');
  112 |     await page.waitForLoadState('networkidle');
  113 |     await page.waitForTimeout(500);
  114 |     await screenshot(page, '39-confirm-email-mobile');
  115 | 
  116 |     await expect(page.locator('text=Check Your Email')).toBeVisible();
  117 |   });
  118 | 
  119 |   test('40 - Reset password page mobile view', async ({ page }) => {
  120 |     await page.setViewportSize({ width: 375, height: 812 });
  121 |     await page.goto('/reset-password');
  122 |     await page.waitForLoadState('networkidle');
  123 |     await page.waitForTimeout(1000);
  124 |     await screenshot(page, '40-reset-password-mobile');
  125 |   });
  126 | 
  127 |   test('41 - Signup owner form validation', async ({ page }) => {
  128 |     await page.goto('/signup');
  129 |     await page.waitForLoadState('networkidle');
  130 |     await page.waitForTimeout(500);
  131 | 
  132 |     await page.locator('text=I\'m a Firm Owner').click();
  133 |     await page.waitForTimeout(500);
  134 | 
  135 |     // Try to submit empty form
  136 |     await page.locator('text=Create Firm & Account').click();
  137 |     await page.waitForTimeout(500);
  138 |     await screenshot(page, '41-signup-validation-error');
  139 | 
  140 |     // Should show validation errors
  141 |     const pageContent = await page.textContent('body');
  142 |     expect(pageContent).toBeDefined();
  143 |   });
  144 | 
  145 |   test('42 - Pricing page renders', async ({ page }) => {
> 146 |     await page.goto('/pricing');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/pricing
  147 |     await page.waitForLoadState('networkidle');
  148 |     await page.waitForTimeout(1000);
  149 |     await screenshot(page, '42-pricing-page');
  150 | 
  151 |     await expect(page.locator('text=Free').first()).toBeVisible();
  152 |   });
  153 | 
  154 |   test('43 - Landing page renders', async ({ page }) => {
  155 |     await page.goto('/');
  156 |     await page.waitForLoadState('networkidle');
  157 |     await page.waitForTimeout(1000);
  158 |     await screenshot(page, '43-landing-page');
  159 | 
  160 |     const pageContent = await page.textContent('body');
  161 |     expect(pageContent).toContain('CaseFiles');
  162 |   });
  163 | });
  164 | 
```