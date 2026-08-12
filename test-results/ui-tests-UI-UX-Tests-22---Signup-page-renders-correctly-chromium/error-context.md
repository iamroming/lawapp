# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-tests.spec.ts >> UI/UX Tests >> 22 - Signup page renders correctly
- Location: tests\ui-tests.spec.ts:16:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/signup
Call log:
  - navigating to "http://localhost:3000/signup", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { screenshot } from './helpers';
  3  | 
  4  | test.describe('UI/UX Tests', () => {
  5  |   test('21 - Login page renders correctly', async ({ page }) => {
  6  |     await page.goto('/login');
  7  |     await page.waitForLoadState('networkidle');
  8  |     await page.waitForTimeout(500);
  9  |     await screenshot(page, '21-login-page');
  10 | 
  11 |     await expect(page.locator('input[type="email"], input[placeholder*="example" i]').first()).toBeVisible();
  12 |     await expect(page.locator('input[type="password"]').first()).toBeVisible();
  13 |     await expect(page.locator('button:has-text("Sign In")').first()).toBeVisible();
  14 |   });
  15 | 
  16 |   test('22 - Signup page renders correctly', async ({ page }) => {
> 17 |     await page.goto('/signup');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/signup
  18 |     await page.waitForLoadState('networkidle');
  19 |     await page.waitForTimeout(1000);
  20 |     await screenshot(page, '22-signup-page');
  21 |   });
  22 | 
  23 |   test('23 - About page renders correctly', async ({ page }) => {
  24 |     await page.goto('/about');
  25 |     await page.waitForLoadState('networkidle');
  26 |     await page.waitForTimeout(1000);
  27 |     await screenshot(page, '23-about-page');
  28 |   });
  29 | 
  30 |   test('24 - Login mobile view', async ({ page }) => {
  31 |     await page.setViewportSize({ width: 375, height: 812 });
  32 |     await page.goto('/login');
  33 |     await page.waitForLoadState('networkidle');
  34 |     await page.waitForTimeout(500);
  35 |     await screenshot(page, '24-login-mobile');
  36 |   });
  37 | 
  38 |   test('25 - Login tablet view', async ({ page }) => {
  39 |     await page.setViewportSize({ width: 768, height: 1024 });
  40 |     await page.goto('/login');
  41 |     await page.waitForLoadState('networkidle');
  42 |     await page.waitForTimeout(500);
  43 |     await screenshot(page, '25-login-tablet');
  44 |   });
  45 | 
  46 |   test('26 - Settings page loads', async ({ page }) => {
  47 |     await page.goto('/settings');
  48 |     await page.waitForLoadState('networkidle');
  49 |     await page.waitForTimeout(2000);
  50 |     await screenshot(page, '26-settings-page');
  51 |   });
  52 | });
  53 | 
```