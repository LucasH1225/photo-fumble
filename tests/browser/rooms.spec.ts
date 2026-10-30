import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import type { PlayerView } from '../../shared/types';

async function state(page: Page): Promise<PlayerView> {
  const code = new URL(page.url()).pathname.split('/')[2];
  const response = await page.request.get(`/api/rooms/${code}/session`);
  expect(response.ok()).toBeTruthy();
  return response.json();
}
async function enter(page: Page, name: string, code?: string) {
  await page.goto('/');
  if (code) await page.getByLabel('Room code').fill(code);
  else await page.getByRole('button', { name: 'Create a room', exact: true }).click();
  await page.getByLabel('Your nickname').fill(name);
  await page.getByRole('button', { name: code ? 'Join room' : 'Create room', exact: true }).click();
  await expect(page).toHaveURL(/\/r\/\d{6}$/);
  await expect(page.getByText('Connected', { exact: true })).toBeVisible();
  return new URL(page.url()).pathname.split('/')[2];
}
test('room forms, simultaneous groups, same-browser tabs, copied invites, and leaving are independent', async ({
  browser,
}) => {
  const contexts: BrowserContext[] = [];
  async function player(phone = false) {
    const context = await browser.newContext({
      viewport: phone ? { width: 390, height: 844 } : { width: 1365, height: 900 },
    });
    contexts.push(context);
    return context.newPage();
  }
  try {
    const a = await player(true);
    await a.goto('/');
    await a.getByLabel('Room code').fill('123');
    await a.getByLabel('Your nickname').fill('Maya');
    await a.getByRole('button', { name: 'Join room', exact: true }).click();
    await expect(a).toHaveURL(/\/$/);
    await a.screenshot({ path: 'output/playwright/rooms-join-phone.png', fullPage: true });
    const codeA = await enter(a, 'Maya');
    expect((await state(a)).hostId).toBeUndefined();
    const b = await a.context().newPage();
    const codeB = await enter(b, 'Maya');
    expect(codeB).not.toBe(codeA);
    expect((await state(a)).me.id).toBe((await state(b)).me.id);
    await a.reload();
    await expect(a.getByText('Connected', { exact: true })).toBeVisible();
    await expect(a.getByTestId('room-code')).toHaveText(codeA);
    await expect(b.getByTestId('room-code')).toHaveText(codeB);
    await a.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await a.getByRole('button', { name: 'Copy invite link' }).click();
    await expect(a.getByText('Invite link copied.', { exact: true })).toBeVisible();
    expect(await a.evaluate(() => navigator.clipboard.readText())).toBe(
      new URL(`/r/${codeA}`, a.url()).href,
    );
    const secondA = await player();
    await enter(secondA, 'Jules', codeA);
    for (const name of ['Jules', 'Noor']) await enter(await player(), name, codeB);
    await expect.poll(async () => (await state(b)).players.filter((p) => p.online).length).toBe(3);
    await expect(a.getByRole('button', { name: 'Everyone’s here · pick a host' })).toBeDisabled();
    await expect(b.getByRole('button', { name: 'Everyone’s here · pick a host' })).toBeEnabled();
    await enter(await player(), 'Noor', codeA);
    await expect(a.getByRole('button', { name: 'Everyone’s here · pick a host' })).toBeEnabled();
    const duplicate = await a.context().newPage();
    await duplicate.goto(`/r/${codeA}`);
    await expect(duplicate.getByText('Connected', { exact: true })).toBeVisible();
    expect((await state(a)).players.filter((p) => p.online)).toHaveLength(3);
    await a.screenshot({ path: 'output/playwright/rooms-lobby-phone.png', fullPage: true });
    await b.screenshot({ path: 'output/playwright/rooms-lobby-desktop.png', fullPage: true });
    expect(await a.locator('body').evaluate((el) => el.scrollWidth)).toBe(390);
    await a.getByRole('button', { name: 'Leave room' }).click();
    await expect(a).toHaveURL(/\/$/);
    await expect
      .poll(async () => (await state(duplicate)).players.filter((p) => p.online).length)
      .toBe(3);
    await duplicate.getByRole('button', { name: 'Leave room' }).click();
    await expect
      .poll(async () => (await state(secondA)).players.filter((p) => p.online).length)
      .toBe(2);
    expect((await state(b)).players.filter((p) => p.online)).toHaveLength(3);
    await a.goto(`/r/${codeA}`);
    await expect(a.getByText('Connected', { exact: true })).toBeVisible();
    expect((await state(a)).me.name).toBe('Maya');
    await expect.poll(async () => (await state(a)).players.filter((p) => p.online).length).toBe(3);
    await b.getByRole('button', { name: 'Leave room' }).click();
    await b.getByRole('button', { name: 'Create a room', exact: true }).focus();
    await b.keyboard.press('Enter');
    await b.getByLabel('Your nickname').focus();
    await b.keyboard.type('Keyboard player');
    await b.keyboard.press('Tab');
    await expect(b.getByRole('button', { name: 'Create room', exact: true })).toBeFocused();
    await b.keyboard.press('Enter');
    await expect(b).toHaveURL(/\/r\/\d{6}$/);
    await expect(b.getByText('Connected', { exact: true })).toBeVisible();
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});
