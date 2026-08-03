import { test, expect } from '@playwright/test';
import { screenshot } from './helpers';

test.describe('UI/UX Tests', () => {
  test('21 - Login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await screenshot(page, '21-login-page');

    await expect(page.locator('input[type="email"], input[placeholder*="example" i]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")').first()).toBeVisible();
  });

  test('22 - Signup page renders correctly', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '22-signup-page');
  });

  test('23 - About page renders correctly', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '23-about-page');
  });

  test('24 - Login mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await screenshot(page, '24-login-mobile');
  });

  test('25 - Login tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await screenshot(page, '25-login-tablet');
  });

  test('26 - Settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, '26-settings-page');
  });
});
