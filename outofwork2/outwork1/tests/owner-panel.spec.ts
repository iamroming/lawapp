import { test, expect } from '@playwright/test';
import { loginAs, screenshot, screenshotBug } from './helpers';

const OWNER_EMAIL = process.env.TEST_OWNER_EMAIL || 'owner@test.com';
const OWNER_PASSWORD = process.env.TEST_OWNER_PASSWORD || 'Test@1234';

test.describe('Owner Panel Tests', () => {
  test('01 - Login as Owner', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '01');
    await screenshot(page, '01-owner-dashboard');
    expect(page.url()).toContain('dashboard');
  });

  test('02 - Owner Dashboard shows firm data', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '02');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, '02-owner-dashboard-data');

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('03 - Sidebar shows Owner Panel for owner', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '03');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const ownerPanelLink = page.locator('a:has-text("Owner Panel")').first();
    const isVisible = await ownerPanelLink.isVisible();

    if (isVisible) {
      await screenshot(page, '03-sidebar-owner-panel-VISIBLE');
    } else {
      await screenshotBug(page, '03-sidebar-owner-panel');
    }
    expect(isVisible).toBeTruthy();
  });

  test('04 - Navigate to Owner Panel', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '04');
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, '04-admin-dashboard');

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('05 - Employees page', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '05');
    await page.goto('/admin/employees');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, '05-employees-page');

    await expect(page.locator('h1')).toContainText('Employees');
  });

  test('06 - Add Employee page', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '06');
    await page.goto('/admin/add-employee');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '06-add-employee-page');

    await expect(page.locator('h1')).toContainText('Add Employee');
  });

  test('07 - Add Employee - Email validation', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '07');
    await page.goto('/admin/add-employee');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('notanemail');

    const generateBtn = page.locator('button:has-text("Generate")').first();
    await generateBtn.click();
    await page.waitForTimeout(1500);

    const errorVisible = await page.locator('text=valid email').isVisible();
    await screenshot(page, '07-email-validation');
    expect(errorVisible).toBeTruthy();
  });

  test('08 - Add Employee - Generate invite code', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '08');
    await page.goto('/admin/add-employee');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('newemployee@gmail.com');

    const generateBtn = page.locator('button:has-text("Generate")').first();
    await generateBtn.click();
    await page.waitForTimeout(3000);

    await screenshot(page, '08-invite-code-generated');
  });

  test('09 - Performance page', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '09');
    await page.goto('/admin/performance');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, '09-performance-page');

    await expect(page.locator('h1')).toContainText('Performance');
  });

  test('10 - Profit Sharing page', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '10');
    await page.goto('/admin/profit-sharing');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, '10-profit-sharing-page');

    await expect(page.locator('h1')).toContainText('Profit Sharing');
  });

  test('11 - Profit Sharing - Set and save', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '11');
    await page.goto('/admin/profit-sharing');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const inputs = page.locator('input[type="number"]');
    const count = await inputs.count();

    if (count > 0) {
      await inputs.nth(0).fill('15');
      await screenshot(page, '11-profit-values-set');

      const saveBtn = page.locator('button:has-text("Save")').first();
      await saveBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '11-profit-saved');
    } else {
      await screenshot(page, '11-no-inputs');
    }
  });

  test('12 - Admin sidebar has all links', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '12');
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '12-admin-sidebar');

    const items = ['Dashboard', 'Employees', 'Add Employee', 'Performance', 'Profit Sharing'];
    for (const item of items) {
      const link = page.locator(`nav a:has-text("${item}")`).first();
      const visible = await link.isVisible();
      console.log(`Sidebar "${item}": ${visible ? 'OK' : 'MISSING'}`);
    }
  });

  test('13 - Employee table shows data', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD, '13');
    await page.goto('/admin/employees');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const table = page.locator('table');
    const hasTable = await table.isVisible();
    await screenshot(page, '13-employees-table');

    if (!hasTable) {
      await screenshotBug(page, '13-employees-table');
    }
    expect(hasTable).toBeTruthy();
  });
});
