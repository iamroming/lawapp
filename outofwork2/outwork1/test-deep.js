const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';
const SNAPS_DIR = path.join(__dirname, 'test2-snaps');

async function deepTest() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Track ALL console messages
  const allConsoleMessages = [];
  const pageErrors = [];

  page.on('console', msg => {
    allConsoleMessages.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  // Track failed network requests
  const failedRequests = [];
  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  const testPages = [
    { url: '/dashboard', name: 'dashboard' },
    { url: '/cases', name: 'cases' },
    { url: '/expenses', name: 'expenses' },
    { url: '/expenses/new', name: 'expenses-new' },
    { url: '/timesheets', name: 'timesheets' },
    { url: '/timesheets/new', name: 'timesheets-new' },
    { url: '/tasks', name: 'tasks' },
    { url: '/tasks/new', name: 'tasks-new' },
    { url: '/research', name: 'research' },
    { url: '/ecourts', name: 'ecourts' },
    { url: '/reports', name: 'reports' },
    { url: '/reports/clients', name: 'reports-clients' },
    { url: '/reports/performance', name: 'reports-performance' },
    { url: '/billing', name: 'billing' },
    { url: '/reminders', name: 'reminders' },
    { url: '/settings', name: 'settings' },
  ];

  const issues = [];

  for (const p of testPages) {
    const preErrorCount = pageErrors.length;
    const preFailedCount = failedRequests.length;

    try {
      await page.goto(BASE_URL + p.url, { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise(r => setTimeout(r, 2000));

      const postErrors = pageErrors.slice(preErrorCount);
      const postFailed = failedRequests.slice(preFailedCount);

      // Check page content
      const pageInfo = await page.evaluate(() => {
        const body = document.body?.textContent || '';
        return {
          hasErrorText: body.includes('Error') && body.includes('error'),
          hasWhiteScreen: body.trim().length < 50,
          hasLoadingSpinner: !!document.querySelector('[class*="animate-spin"]'),
          hasEmptyState: body.includes('No ') || body.includes('no '),
          hasContent: body.length > 200,
        };
      });

      const hasIssue = postErrors.length > 0 || postFailed.length > 0 || pageInfo.hasWhiteScreen;
      if (hasIssue) {
        issues.push({
          page: p.url,
          name: p.name,
          consoleErrors: postErrors,
          failedRequests: postFailed,
          pageInfo,
        });
        // Take error screenshot
        await page.screenshot({ path: path.join(SNAPS_DIR, `ERROR-${p.name}.png`), fullPage: true });
        console.log(`ISSUE: ${p.url}`);
        if (postErrors.length) console.log(`  Console errors: ${postErrors.join(' | ').substring(0, 300)}`);
        if (postFailed.length) console.log(`  Failed requests: ${JSON.stringify(postFailed)}`);
        if (pageInfo.hasWhiteScreen) console.log(`  WHITE SCREEN DETECTED`);
      } else {
        await page.screenshot({ path: path.join(SNAPS_DIR, `OK-${p.name}.png`), fullPage: false });
        console.log(`OK: ${p.url}`);
      }
    } catch (err) {
      issues.push({ page: p.url, name: p.name, error: err.message });
      try { await page.screenshot({ path: path.join(SNAPS_DIR, `CRASH-${p.name}.png`), fullPage: true }); } catch {}
      console.log(`CRASH: ${p.url} - ${err.message.substring(0, 150)}`);
    }
  }

  console.log(`\n=== DEEP TEST RESULTS ===`);
  console.log(`Pages tested: ${testPages.length}`);
  console.log(`Issues found: ${issues.length}`);
  console.log(`Total page errors: ${pageErrors.length}`);
  console.log(`Total failed requests: ${failedRequests.length}`);

  if (pageErrors.length > 0) {
    console.log('\nAll page errors:');
    [...new Set(pageErrors)].forEach(e => console.log(`  - ${e.substring(0, 200)}`));
  }
  if (failedRequests.length > 0) {
    console.log('\nFailed requests:');
    [...new Set(failedRequests.map(f => f.url))].forEach(u => console.log(`  - ${u}`));
  }

  // Filter only error console messages
  const errorConsole = allConsoleMessages.filter(m => m.type === 'error');
  if (errorConsole.length > 0) {
    console.log(`\nConsole errors (${errorConsole.length}):`);
    [...new Set(errorConsole.map(e => e.text))].slice(0, 10).forEach(e => console.log(`  - ${e.substring(0, 200)}`));
  }

  fs.writeFileSync(path.join(SNAPS_DIR, 'deep-test-report.json'), JSON.stringify({
    timestamp: new Date().toISOString(),
    pages: testPages.length,
    issues,
    pageErrors: [...new Set(pageErrors)],
    failedRequests,
    errorConsole: errorConsole.map(e => e.text),
  }, null, 2));

  await browser.close();
}

deepTest().catch(err => { console.error('Failed:', err); process.exit(1); });
