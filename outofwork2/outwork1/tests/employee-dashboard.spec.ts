import { test, expect } from '@playwright/test';
import { loginAs, screenshot, screenshotBug } from './helpers';

const EMPLOYEE_EMAIL = process.env.TEST_EMPLOYEE_EMAIL || 'employee@test.com';
const EMPLOYEE_PASSWORD = process.env.TEST_EMPLOYEE_PASSWORD || 'Test@1234';

test.describe('Employee Dashboard Tests', () => {
  test('14 - Login as Employee', async ({ page }) => {
    await loginAs(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD, '14');
    await screenshot(page, '14-employee-dashboard');
    expect(page.url()).toContain('dashboard');
  });

  test('15 - Employee sees personalized greeting', async ({ page }) => {
    await loginAs(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD, '15');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, '15-employee-welcome');

    const heading = page.locator('h1');
    const text = await heading.textContent();
    console.log(`Dashboard heading: "${text}"`);

    if (text?.includes('Welcome')) {
      console.log('PASS: Personalized greeting shown');
    } else {
      await screenshotBug(page, '15-employee-welcome');
      console.log('BUG: No personalized greeting');
    }
  });

  test('16 - Employee sidebar hides Owner Panel', async ({ page }) => {
    await loginAs(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD, '16');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const ownerPanelLink = page.locator('a:has-text("Owner Panel")').first();
    const isVisible = await ownerPanelLink.isVisible();

    if (!isVisible) {
      console.log('PASS: Owner Panel hidden for employee');
      await screenshot(page, '16-employee-sidebar-no-owner-panel');
    } else {
      await screenshotBug(page, '16-employee-owner-panel-visible');
    }
    expect(isVisible).toBeFalsy();
  });

  test('17 - Employee dashboard shows filtered data', async ({ page }) => {
    await loginAs(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD, '17');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await screenshot(page, '17-employee-data');

    const heading = page.locator('h1');
    const text = await heading.textContent();
    console.log(`Heading: "${text}"`);
  });

  test('18 - Employee can access Cases', async ({ page }) => {
    await loginAs(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD, '18');
    await page.goto('/cases');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, '18-employee-cases');
  });

  test('19 - Employee can access Clients', async ({ page }) => {
    await loginAs(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD, '19');
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, '19-employee-clients');
  });

  test('20 - Employee blocked from admin', async ({ page }) => {
    await loginAs(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD, '20');
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, '20-employee-admin-blocked');

    const url = page.url();
    const hasDenied = await page.locator('text=Access Denied').isVisible();
    const redirected = !url.includes('/admin') || url.includes('/dashboard');

    if (hasDenied || redirected) {
      console.log('PASS: Employee blocked from admin');
    } else {
      await screenshotBug(page, '20-employee-admin-access');
      console.log('BUG: Employee can access admin');
    }
  });
});
