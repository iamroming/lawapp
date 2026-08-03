const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';
const SNAPS_DIR = path.join(__dirname, 'test2-snaps');

if (!fs.existsSync(SNAPS_DIR)) fs.mkdirSync(SNAPS_DIR, { recursive: true });

const PAGES = [
  { url: '/dashboard', name: '01-dashboard' },
  { url: '/cases', name: '02-cases-list' },
  { url: '/expenses', name: '03-expenses-list' },
  { url: '/expenses/new', name: '04-expenses-new' },
  { url: '/timesheets', name: '05-timesheets-list' },
  { url: '/timesheets/new', name: '06-timesheets-new' },
  { url: '/tasks', name: '07-tasks-board' },
  { url: '/tasks/new', name: '08-tasks-new' },
  { url: '/reports', name: '09-reports' },
  { url: '/reports/clients', name: '10-reports-clients' },
  { url: '/reports/performance', name: '11-reports-performance' },
  { url: '/ecourts', name: '12-ecourts-tracking' },
  { url: '/research', name: '13-court-research' },
  { url: '/billing', name: '14-billing' },
  { url: '/reminders', name: '15-reminders' },
];

async function runTests() {
  console.log('Launching Edge browser...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ page: 'console', text: msg.text() });
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push({ page: 'pageerror', text: err.message });
  });

  const errors = [];
  const results = [];

  for (const p of PAGES) {
    const url = BASE_URL + p.url;
    console.log(`Testing: ${p.url} ...`);
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const statusCode = response ? response.status() : 'N/A';

      // Wait a moment for any client-side rendering
      await new Promise(r => setTimeout(r, 2000));

      // Check for error elements in the page
      const pageErrors = await page.evaluate(() => {
        const errs = [];
        // Check for Next.js error overlay
        const errorOverlay = document.querySelector('nextjs-portal');
        if (errorOverlay && errorOverlay.shadowRoot) {
          const overlayText = errorOverlay.shadowRoot.textContent;
          if (overlayText && overlayText.includes('Error')) {
            errs.push(overlayText.substring(0, 500));
          }
        }
        // Check for React error boundary
        const errorBoundary = document.querySelector('[data-nextjs-dialog-left-right]');
        if (errorBoundary) {
          errs.push(errorBoundary.textContent?.substring(0, 500));
        }
        // Check for "Application error" text
        const body = document.body?.textContent || '';
        if (body.includes('Application error') || body.includes('Unhandled Runtime Error')) {
          const match = body.match(/(Application error|Unhandled Runtime Error)[\s\S]{0,500}/);
          if (match) errs.push(match[0]);
        }
        return errs;
      });

      // Screenshot
      const screenshotPath = path.join(SNAPS_DIR, `${p.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      const status = statusCode;
      const hasErrors = pageErrors.length > 0;
      results.push({ page: p.url, status, hasErrors, screenshot: p.name });

      if (hasErrors || status !== 200) {
        errors.push({ page: p.url, status, pageErrors, screenshot: p.name });
        console.log(`  *** ERROR ${status} - ${pageErrors.length} error(s) found ***`);
        pageErrors.forEach(e => console.log(`    Error: ${e.substring(0, 200)}`));
      } else {
        console.log(`  OK (${status})`);
      }
    } catch (err) {
      const screenshotPath = path.join(SNAPS_DIR, `${p.name}-error.png`);
      try { await page.screenshot({ path: screenshotPath }); } catch {}
      errors.push({ page: p.url, status: 'TIMEOUT/ERROR', error: err.message, screenshot: p.name });
      console.log(`  FAILED: ${err.message.substring(0, 200)}`);
    }
  }

  // Write error report
  const report = {
    timestamp: new Date().toISOString(),
    totalPages: PAGES.length,
    passedPages: results.filter(r => !r.hasErrors && r.status === 200).length,
    failedPages: errors.length,
    consoleErrors: consoleErrors.slice(0, 20),
    errors,
    results,
  };

  fs.writeFileSync(path.join(SNAPS_DIR, 'test-report.json'), JSON.stringify(report, null, 2));
  console.log(`\n=== TEST RESULTS ===`);
  console.log(`Passed: ${report.passedPages}/${report.totalPages}`);
  console.log(`Failed: ${report.failedPages}`);
  if (consoleErrors.length > 0) {
    console.log(`Console errors: ${consoleErrors.length}`);
  }
  console.log(`Report saved to test2-snaps/test-report.json`);

  await browser.close();
}

runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
