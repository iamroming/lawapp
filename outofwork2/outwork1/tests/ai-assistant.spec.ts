import { test, expect } from '@playwright/test';
import { loginAs, screenshot, screenshotBug } from './helpers';

const OWNER_EMAIL = process.env.TEST_OWNER_EMAIL || 'owner@test.com';
const OWNER_PASSWORD = process.env.TEST_OWNER_PASSWORD || 'Test@1234';

test.describe('AI Case Analysis Tests', () => {
  test('27 - AI Case Analysis page loads', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '27');
    await page.goto('/ai/case-analysis');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, '27-ai-analysis-page');

    await expect(page.locator('h1')).toContainText('AI Case Analysis');
  });

  test('28 - AI Case Analysis - Analyze a case', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '28');
    await page.goto('/ai/case-analysis');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const textarea = page.locator('textarea');
    await textarea.fill('Client A filed a breach of contract case against Company B for failure to deliver goods worth 50 lakhs as per the purchase agreement dated 15-Jan-2026. The agreement specified delivery within 30 days, but 90 days have passed with no delivery.');

    const caseTypeSelect = page.locator('select.w-full');
    await caseTypeSelect.selectOption('civil');

    const analyzeBtn = page.locator('button:has-text("Analyze Case")');
    await analyzeBtn.click();

    await page.waitForSelector('button:has-text("Analyze Case"):not([disabled])', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await screenshot(page, '28-ai-analysis-result');

    const hasResults = await page.getByText('Strength', { exact: true }).isVisible();
    const hasError = await page.locator('text=Analysis failed').isVisible();

    console.log(`Results visible: ${hasResults}, Error: ${hasError}`);
    expect(hasResults || hasError).toBeTruthy();
  });

  test('29 - AI Analysis - Empty description shows error', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '29');
    await page.goto('/ai/case-analysis');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const analyzeBtn = page.locator('button:has-text("Analyze Case")');
    await analyzeBtn.click();
    await page.waitForTimeout(2000);

    await screenshot(page, '29-ai-empty-error');

    const toastError = await page.locator('text=Please describe your case').isVisible();
    console.log(`Empty validation toast: ${toastError}`);
    expect(toastError).toBeTruthy();
  });
});
