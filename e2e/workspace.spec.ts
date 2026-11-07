import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('product first, profile setup, shareable filters and persistence', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your scholarship journey starts here.' })).toBeVisible();
  await page.getByRole('button', { name: 'Set up my profile' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Preferred name').fill('Test Student');
  await dialog.getByLabel('Category', { exact: true }).selectOption('General');
  await dialog.getByLabel('Annual family income').fill('300000');
  await dialog.getByLabel('Last marks').fill('82');
  await dialog.getByLabel('State / UT').selectOption('Bihar');
  await dialog.getByLabel('Gender', { exact: true }).selectOption('F');
  await dialog.getByLabel('Benchmark disability').selectOption('no');
  await dialog.getByLabel('Notified minority').selectOption('no');
  await dialog.getByRole('button', { name: 'Save profile' }).click();
  await page.getByRole('link', { name: 'Find scholarships', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search scholarships or providers' }).fill('Pragati');
  await expect(page).toHaveURL(/q=Pragati/);
  await expect(page.locator('.card')).toHaveCount(2);
  await page.reload(); await expect(page.getByRole('searchbox', { name: 'Search scholarships or providers' })).toHaveValue('Pragati');
  await page.getByRole('button', { name: 'Save & track AICTE Pragati — Technical Degree' }).click();
  await page.getByRole('link', { name: /My applications/ }).click();
  await expect(page.getByRole('heading', { name: 'AICTE Pragati — Technical Degree' })).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading', { name: 'AICTE Pragati — Technical Degree' })).toBeVisible();
});

test('deep links, back navigation and keyboard dialogs', async ({ page }) => {
  await page.goto('/scholarships/aicte-pragati-degree');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'AICTE Pragati — Technical Degree' })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page).toHaveURL(/\/discover$/);
  await page.getByRole('button', { name: 'View details for AICTE Pragati — Technical Degree' }).click();
  await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Control+k'); await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.keyboard.press('Escape'); await page.getByRole('navigation').getByRole('link', { name: 'Deadline calendar', exact: true }).click(); await page.goBack(); await expect(page).toHaveURL(/\/discover$/);
});

test('local document upload, download and deletion', async ({ page }) => {
  await page.goto('/vault');
  await page.getByLabel('Upload local file for Aadhaar').setInputFiles({ name: 'sample.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nlocal test') });
  await expect(page.getByText('sample.pdf · 0.0 MB')).toBeVisible();
  await page.reload(); await expect(page.getByText('sample.pdf · 0.0 MB')).toBeVisible();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download local copy of Aadhaar' }).click(); expect((await download).suggestedFilename()).toBe('sample.pdf');
  await page.getByRole('button', { name: 'Delete local file for Aadhaar' }).click(); await page.getByRole('button', { name: 'Delete file', exact: true }).click(); await expect(page.getByLabel('Upload local file for Aadhaar')).toBeVisible();
});

test('all main routes pass axe and narrow viewports do not overflow', async ({ page }, info) => {
  for (const route of ['/', '/discover', '/applications', '/deadlines', '/vault', '/assistant']) {
    await page.goto(route); await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('.page-fallback')).toHaveCount(0);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(result.violations, `${route} accessibility`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${route} horizontal overflow`).toBe(true);
    if (info.project.name === 'desktop' && route === '/') await page.screenshot({ path: 'docs/screenshots/workspace-desktop.png', fullPage: true });
    if (info.project.name === 'mobile' && route === '/') await page.screenshot({ path: 'docs/screenshots/workspace-mobile.png', fullPage: true });
  }
});

test('mobile kanban uses a stage switcher and exports real files', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile-specific layout');
  await page.goto('/discover'); await page.getByRole('button', { name: 'Save & track AICTE Pragati — Technical Degree' }).click();
  await page.getByRole('link', { name: /My applications/ }).click();
  await expect(page.locator('.board-col:visible')).toHaveCount(1);
  await page.getByLabel('Move AICTE Pragati — Technical Degree to stage').selectOption('progress');
  await page.getByRole('button', { name: 'In progress · 1' }).click(); await expect(page.locator('.board-col:visible')).toHaveAttribute('data-stage', 'progress');
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export CSV' }).click(); expect((await download).suggestedFilename()).toMatch(/applications.*csv/);
});

test('dark theme, profile and details dialogs remain accessible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  let result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze(); expect(result.violations, 'dark workspace').toEqual([]);
  await page.getByRole('button', { name: /Profile (?:&|and) privacy/ }).first().click();
  result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze(); expect(result.violations, 'profile dialog').toEqual([]);
  await page.keyboard.press('Escape');
  await page.goto('/scholarships/aicte-pragati-degree');
  result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze(); expect(result.violations, 'details dialog').toEqual([]);
});

test('catalogue failure offers retry and unknown routes recover', async ({ page }) => {
  await page.route('**/data/scholarships.json', route => route.fulfill({ status: 503, body: 'unavailable' }));
  await page.goto('/'); await expect(page.getByRole('alert')).toContainText('saved profile has not been changed');
  await page.unroute('**/data/scholarships.json'); await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Your scholarship journey starts here.' })).toBeVisible();
  await page.goto('/not-a-real-page'); await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.getByRole('button', { name: 'Return to overview' }).click(); await expect(page).toHaveURL('/');
  await page.goto('/scholarships/missing'); await expect(page.getByRole('heading', { name: 'Scholarship not found' })).toBeVisible();
});

test('backup round trip and explicit clear-data confirmation', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Set up my profile' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Preferred name').fill('Backup Student');
  await dialog.getByLabel('Category', { exact: true }).selectOption('General');
  await dialog.getByLabel('Annual family income').fill('200000'); await dialog.getByLabel('Last marks').fill('85');
  await dialog.getByLabel('State / UT').selectOption('Bihar'); await dialog.getByLabel('Gender', { exact: true }).selectOption('F');
  await dialog.getByLabel('Benchmark disability').selectOption('no'); await dialog.getByLabel('Notified minority').selectOption('no');
  await dialog.getByRole('button', { name: 'Save profile' }).click();
  await page.getByRole('button', { name: /Profile (?:&|and) privacy/ }).first().click();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export backup' }).click();
  const path = await (await download).path(); if (!path) throw new Error('Backup download missing'); const { readFile } = await import('node:fs/promises'); const buffer = await readFile(path);
  await page.getByRole('button', { name: 'Clear saved data' }).click(); await expect(page.getByText(/This cannot be undone/)).toBeVisible();
  await page.getByRole('button', { name: 'Delete all local data' }).click();
  await page.getByRole('button', { name: 'Set up my profile' }).click();
  await page.getByLabel('Import Grantly backup').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer });
  await page.getByRole('button', { name: /Profile (?:&|and) privacy/ }).first().click();
  await expect(page.getByRole('dialog').getByLabel('Preferred name')).toHaveValue('Backup Student');
});

test('optional tour respects reduced motion and returns to the product', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/tour');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('One student.');
  await expect(page.getByRole('button', { name: 'Pause motion' })).toHaveCount(0);
  await page.getByRole('button', { name: /Enter workspace/ }).click(); await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Your scholarship journey starts here.' })).toBeVisible();
});
