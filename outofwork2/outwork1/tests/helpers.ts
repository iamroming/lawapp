import { test as base, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-screenshots');

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function loginAs(page: Page, email: string, password: string, screenshotPrefix: string) {
  ensureDir(SCREENSHOT_DIR);

  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    if (!page.url().includes('/login')) {
      return;
    }

    const emailInput = page.locator('input[placeholder*="example" i], input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill(email);
    await passwordInput.fill(password);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${screenshotPrefix}-login-filled.png`), fullPage: true });

    const submitBtn = page.locator('button:has-text("Sign In"), button[type="submit"]').first();
    await submitBtn.click();

    try {
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      return;
    } catch {
      if (attempt < MAX_RETRIES) {
        await page.waitForTimeout(2000 * (attempt + 1));
        continue;
      }
      throw new Error(`Login failed for ${email} after ${MAX_RETRIES + 1} attempts`);
    }
  }
}

export async function screenshot(page: Page, name: string, options?: { fullPage?: boolean }) {
  ensureDir(SCREENSHOT_DIR);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: options?.fullPage ?? true,
  });
}

export async function screenshotBug(page: Page, name: string) {
  ensureDir(SCREENSHOT_DIR);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}-BUG.png`),
    fullPage: true,
  });
}
