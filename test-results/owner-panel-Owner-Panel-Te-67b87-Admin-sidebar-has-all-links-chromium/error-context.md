# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: owner-panel.spec.ts >> Owner Panel Tests >> 12 - Admin sidebar has all links
- Location: tests\owner-panel.spec.ts:149:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
Call log:
  - navigating to "http://localhost:3000/login", waiting until "load"

```

# Test source

```ts
  1  | import { test as base, expect, Page } from '@playwright/test';
  2  | import path from 'path';
  3  | import fs from 'fs';
  4  | 
  5  | const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-screenshots');
  6  | 
  7  | export function ensureDir(dir: string) {
  8  |   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  9  | }
  10 | 
  11 | export async function loginAs(page: Page, email: string, password: string, screenshotPrefix: string) {
  12 |   ensureDir(SCREENSHOT_DIR);
  13 | 
  14 |   const MAX_RETRIES = 2;
  15 | 
  16 |   for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
> 17 |     await page.goto('/login');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
  18 |     await page.waitForLoadState('networkidle');
  19 |     await page.waitForTimeout(500);
  20 | 
  21 |     if (!page.url().includes('/login')) {
  22 |       return;
  23 |     }
  24 | 
  25 |     const emailInput = page.locator('input[placeholder*="example" i], input[type="email"]').first();
  26 |     const passwordInput = page.locator('input[type="password"]').first();
  27 | 
  28 |     await emailInput.fill(email);
  29 |     await passwordInput.fill(password);
  30 | 
  31 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${screenshotPrefix}-login-filled.png`), fullPage: true });
  32 | 
  33 |     const submitBtn = page.locator('button:has-text("Sign In"), button[type="submit"]').first();
  34 |     await submitBtn.click();
  35 | 
  36 |     try {
  37 |       await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  38 |       await page.waitForLoadState('networkidle');
  39 |       await page.waitForTimeout(1000);
  40 |       return;
  41 |     } catch {
  42 |       if (attempt < MAX_RETRIES) {
  43 |         await page.waitForTimeout(2000 * (attempt + 1));
  44 |         continue;
  45 |       }
  46 |       throw new Error(`Login failed for ${email} after ${MAX_RETRIES + 1} attempts`);
  47 |     }
  48 |   }
  49 | }
  50 | 
  51 | export async function screenshot(page: Page, name: string, options?: { fullPage?: boolean }) {
  52 |   ensureDir(SCREENSHOT_DIR);
  53 |   await page.screenshot({
  54 |     path: path.join(SCREENSHOT_DIR, `${name}.png`),
  55 |     fullPage: options?.fullPage ?? true,
  56 |   });
  57 | }
  58 | 
  59 | export async function screenshotBug(page: Page, name: string) {
  60 |   ensureDir(SCREENSHOT_DIR);
  61 |   await page.screenshot({
  62 |     path: path.join(SCREENSHOT_DIR, `${name}-BUG.png`),
  63 |     fullPage: true,
  64 |   });
  65 | }
  66 | 
```