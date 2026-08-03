const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';
const SNAPS_DIR = path.join(__dirname, 'test2-snaps');

async function runAuthTests() {
  console.log('Launching Edge browser...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];

  // Test login page
  console.log('\n=== AUTH PAGES ===');
  const authPages = ['/login', '/signup', '/auth/callback'];
  for (const p of authPages) {
    try {
      const resp = await page.goto(BASE_URL + p, { waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise(r => setTimeout(r, 1500));
      const ssPath = path.join(SNAPS_DIR, `auth-${p.replace(/\//g, '-')}.png`);
      await page.screenshot({ path: ssPath, fullPage: false });
      console.log(`${p} => ${resp.status()}`);
    } catch (err) {
      console.log(`${p} => ERROR: ${err.message.substring(0, 100)}`);
      errors.push({ page: p, error: err.message });
    }
  }

  // Check login page elements
  console.log('\n=== LOGIN PAGE ELEMENTS ===');
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  const loginElements = await page.evaluate(() => {
    const elements = {};
    elements.emailInput = !!document.querySelector('input[type="email"], input[name="email"], input[placeholder*="email"]');
    elements.passwordInput = !!document.querySelector('input[type="password"], input[name="password"]');
    elements.submitButton = !!document.querySelector('button[type="submit"]');
    elements.loginText = document.body?.textContent?.includes('Sign In') || document.body?.textContent?.includes('Login') || document.body?.textContent?.includes('Log In');
    elements.googleButton = false;
    document.querySelectorAll('button').forEach(btn => {
      if (btn.textContent?.includes('Google')) elements.googleButton = true;
    });
    return elements;
  });
  console.log('Login elements:', JSON.stringify(loginElements, null, 2));
  await page.screenshot({ path: path.join(SNAPS_DIR, 'auth-login-detail.png'), fullPage: true });

  // Check signup page elements
  console.log('\n=== SIGNUP PAGE ELEMENTS ===');
  await page.goto(BASE_URL + '/signup', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  const signupElements = await page.evaluate(() => {
    const elements = {};
    elements.fullNameInput = !!document.querySelector('input[placeholder*="full name"], input[placeholder*="Full Name"], input[name*="name"]');
    elements.emailInput = !!document.querySelector('input[type="email"], input[name="email"], input[placeholder*="email"]');
    elements.passwordInput = !!document.querySelector('input[type="password"], input[name="password"]');
    elements.submitButton = !!document.querySelector('button[type="submit"]');
    return elements;
  });
  console.log('Signup elements:', JSON.stringify(signupElements, null, 2));
  await page.screenshot({ path: path.join(SNAPS_DIR, 'auth-signup-detail.png'), fullPage: true });

  // Test sidebar rendering when not authenticated
  console.log('\n=== UNAUTHENTICATED DASHBOARD ===');
  await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  const dashCheck = await page.evaluate(() => {
    return {
      hasRedirect: window.location.href.includes('login'),
      currentUrl: window.location.href,
      hasDashboardContent: !!document.querySelector('[class*="dashboard"]') || document.body?.textContent?.includes('Dashboard'),
    };
  });
  console.log('Dashboard redirect check:', JSON.stringify(dashCheck));
  await page.screenshot({ path: path.join(SNAPS_DIR, 'auth-dashboard-unauth.png'), fullPage: false });

  // Check for console errors
  const consoleErrs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrs.push(msg.text());
  });

  // Test API routes error handling (unauthenticated)
  console.log('\n=== API ROUTE TESTS (unauthenticated) ===');
  const apiRoutes = ['/api/expenses', '/api/timesheets', '/api/tasks', '/api/case-alerts', '/api/case-alerts/history', '/api/case-alerts/check'];
  for (const r of apiRoutes) {
    try {
      const resp = await page.goto(BASE_URL + r, { waitUntil: 'networkidle2', timeout: 10000 });
      const body = await page.evaluate(() => document.body?.textContent?.substring(0, 200) || '');
      const contentType = resp.headers()['content-type'] || '';
      const isJson = contentType.includes('json');
      const isError = resp.status() >= 400;
      const hasHtmlRedirect = body.includes('<!DOCTYPE html>');
      
      if (isJson) {
        console.log(`${r} => ${resp.status()} [JSON] ${body.substring(0, 100)}`);
      } else if (hasHtmlRedirect) {
        console.log(`${r} => ${resp.status()} [HTML redirect]`);
      } else {
        console.log(`${r} => ${resp.status()} [${contentType}] ${body.substring(0, 100)}`);
      }
    } catch (err) {
      console.log(`${r} => ERROR: ${err.message.substring(0, 100)}`);
      errors.push({ page: r, error: err.message });
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Errors found: ${errors.length}`);
  errors.forEach(e => console.log(`  - ${e.page}: ${e.error.substring(0, 150)}`));

  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    authTests: { loginElements, signupElements, dashCheck },
    apiTests: apiRoutes,
    errors,
    consoleErrors: consoleErrs,
  };
  fs.writeFileSync(path.join(SNAPS_DIR, 'auth-test-report.json'), JSON.stringify(report, null, 2));
  console.log('\nReport saved to test2-snaps/auth-test-report.json');

  await browser.close();
}

runAuthTests().catch(err => {
  console.error('Auth test failed:', err);
  process.exit(1);
});
