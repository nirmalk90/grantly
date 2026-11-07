import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import { mkdir, writeFile } from 'node:fs/promises';
const url = process.env.AUDIT_URL ?? 'http://127.0.0.1:4173/';
const port = 9222;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: [`--remote-debugging-port=${port}`, '--no-sandbox', '--disable-dev-shm-usage'] });
try {
  const result = await lighthouse(url, { port, output: ['json', 'html'], logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], formFactor: 'mobile', screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }, throttlingMethod: 'simulate' });
  if (!result) throw new Error('Lighthouse returned no result');
  await mkdir('docs/audits', { recursive: true });
  await writeFile('docs/audits/lighthouse.report.json', result.report[0]);
  await writeFile('docs/audits/lighthouse.report.html', result.report[1]);
  const scores = Object.fromEntries(Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)]));
  const metrics = Object.fromEntries(['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time'].map(key => [key, result.lhr.audits[key].numericValue]));
  const summary = { url, date: result.lhr.fetchTime, scores, metrics, thresholds: { performance: 90, accessibility: 95, 'best-practices': 95, seo: 95 }, note: 'Local production-build mobile audit. Not the external evaluator score.' };
  await writeFile('docs/audits/summary.json', JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
  const failures = Object.entries(summary.thresholds).filter(([key, min]) => scores[key] < min);
  if (metrics['largest-contentful-paint'] > 2500) failures.push(['LCP', 2500]);
  if (metrics['cumulative-layout-shift'] > 0.1) failures.push(['CLS', 0.1]);
  if (metrics['total-blocking-time'] > 200) failures.push(['TBT', 200]);
  if (failures.length) { console.error('Budget failures:', failures); process.exitCode = 1; }
} finally { await browser.close(); }
