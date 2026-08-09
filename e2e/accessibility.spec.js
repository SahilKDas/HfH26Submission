import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function expectNoSeriousViolations(page) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(({ impact }) => ['serious', 'critical'].includes(impact));
  expect(serious, serious.map(({ id, help }) => `${id}: ${help}`).join('\n')).toEqual([]);
}

async function navigateFromHeader(page, name) {
  const toggle = page.getByRole('button', { name: /toggle navigation/i });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByLabel('Main navigation').getByRole('button', { name }).click();
}

test('home, check-in, and Method surfaces have no serious Axe violations', async ({ page }) => {
  await page.goto('/');
  await expectNoSeriousViolations(page);
  await page.getByRole('button', { name: /find my next step/i }).click();
  await expect(page.getByRole('dialog', { name: /what is your body telling you/i })).toBeVisible();
  await expectNoSeriousViolations(page);
  await page.getByRole('button', { name: /close check-in/i }).click();
  await navigateFromHeader(page, /how it works/i);
  await page.getByText(/open the constraint lab/i).click();
  await expect(page.getByRole('heading', { name: /make the model show its work/i })).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('check-in contains keyboard focus and restores it when closed', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /find my next step/i });
  await trigger.focus(); await trigger.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('demo mode uses an isolated flow and reset surface', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.getByText('Demo Mode')).toBeVisible();
  await page.getByRole('button', { name: /load judging flow/i }).click();
  await expect(page.getByRole('button', { name: /thoughts racing/i })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('unspool:')))).toEqual([]);
});

test('radio makes no provider request before explicit Play', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.__unspoolAudioCount = 0;
    window.Audio = function Audio(...args) { window.__unspoolAudioCount += 1; return new NativeAudio(...args); };
    window.Audio.prototype = NativeAudio.prototype;
  });
  const radioRequests = [];
  page.on('request', (request) => { if (request.url().includes('radio.loficafe.net')) radioRequests.push(request.url()); });
  await page.goto('/');
  await page.waitForTimeout(500);
  expect(radioRequests).toEqual([]);
  expect(await page.evaluate(() => window.__unspoolAudioCount)).toBe(1);
  await navigateFromHeader(page, /how it works/i);
  expect(await page.evaluate(() => window.__unspoolAudioCount)).toBe(1);
});

test('app shell and core check-in remain available offline after first load', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await expect.poll(() => page.evaluate(async () => {
    for (const name of await caches.keys()) {
      const requests = await (await caches.open(name)).keys();
      if (requests.some((request) => ['/', '/index.html'].includes(new URL(request.url).pathname))) return true;
    }
    return false;
  }), { timeout: 15_000 }).toBe(true);
  await context.route('**/*', async (route) => {
    if (route.request().serviceWorker()) await route.abort('internetdisconnected');
    else await route.continue();
  });
  const offlineResponse = await page.reload();
  expect(offlineResponse.fromServiceWorker()).toBe(true);
  await context.setOffline(true);
  await expect(page.getByRole('heading', { name: /when everything is too much/i })).toBeVisible();
  await expect(page.getByText(/check-ins and saved local insights still work/i)).toBeVisible();
  await page.getByRole('button', { name: /find my next step/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('native server is provider-neutral and emits a hashed script policy', async ({ request }) => {
  const health = await request.get('/healthz');
  expect(await health.json()).toMatchObject({ status: 'ok', runtime: 'c++23', privacyMode: 'local-first', networkAudit: 'none' });
  const shell = await request.get('/');
  expect(shell.headers()['content-security-policy']).toMatch(/script-src 'self' 'sha256-[A-Za-z0-9+/]+=*'/);
  expect(shell.headers()['content-security-policy']).not.toMatch(/script-src[^;]*unsafe-inline/);
  expect((await request.post('/api/audit')).status()).toBe(404);
});

test('exact audit runs locally without any API request', async ({ page }) => {
  const apiRequests = [];
  page.on('request', (request) => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()); });
  await page.goto('/');
  await navigateFromHeader(page, /how it works/i);
  await page.getByRole('button', { name: /run local audit/i }).click();
  await expect(page.getByText(/all fixed safety constraints passed/i)).toBeVisible();
  await expect(page.getByText('3072', { exact: true })).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test('complete check-in, guided practice, explicit feedback, and Insights flow', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /find my next step/i }).click();
  await page.getByRole('button', { name: /thoughts racing/i }).click();
  await page.getByRole('button', { name: /^continue/i }).click();
  await page.getByRole('button', { name: 'Less input' }).click();
  await page.getByRole('button', { name: 'About 45 sec' }).click();
  await page.getByRole('button', { name: /^continue/i }).click();
  await page.getByRole('button', { name: /create my step/i }).click();
  await expect(page.getByRole('heading', { name: /turn the volume down/i })).toBeVisible();
  await page.getByRole('button', { name: /guide me step by step/i }).click();
  await expect(page.getByRole('dialog', { name: /choose one input/i })).toBeVisible();
  await page.clock.install();
  await page.getByRole('button', { name: /^start$/i }).click();
  await page.clock.fastForward(46_000);
  await expect(page.getByRole('heading', { name: /where is the intensity now/i })).toBeVisible();
  await page.getByRole('button', { name: '4', exact: true }).click();
  await page.getByRole('button', { name: /helped/i }).click();
  await page.getByRole('button', { name: /return home/i }).click();
  await navigateFromHeader(page, /my pattern/i);
  await expect(page.getByText(/1 completed/i)).toBeVisible();
  await expect(page.getByRole('img', { name: /recent explicitly reported after-intensity scores/i })).toBeVisible();
});

test('360px reflow and reduced-motion preferences preserve core controls', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce', contrast: 'more' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /find my next step/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await navigateFromHeader(page, /how it works/i);
  await expect(page.getByText(/open the constraint lab/i)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
