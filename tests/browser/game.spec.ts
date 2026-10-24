import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { MODE_INFO, MODES, type PlayerView } from '../../shared/types';
const playerCount = process.env.E2E_PLAYERS === '3' ? 3 : 4;

function recording() {
  const samples = 8000;
  const b = Buffer.alloc(44 + samples * 2);
  b.write('RIFF', 0);
  b.writeUInt32LE(b.length - 8, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(8000, 24);
  b.writeUInt32LE(16000, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    b.writeInt16LE(Math.round(Math.sin(i * 0.1) * 1200), 44 + i * 2);
  return b;
}
async function state(page: Page): Promise<PlayerView> {
  const response = await page.request.get('/api/session');
  expect(response.ok()).toBeTruthy();
  return response.json();
}
async function waitPhase(page: Page, phase: string) {
  await expect.poll(async () => (await state(page)).game?.phase).toBe(phase);
}

test(`${playerCount} browsers play all five modes, refresh safely, and late arrivals wait`, async ({
  browser,
}) => {
  const contexts: BrowserContext[] = [];
  const pages: Page[] = [];
  const names = ['Maya', 'Jules', 'Noor', 'Eli'];
  const errors: string[] = [];
  for (let i = 0; i < playerCount; i++) {
    const context = await browser.newContext({
      viewport: i === 1 ? { width: 390, height: 844 } : { width: 1365, height: 900 },
    });
    contexts.push(context);
    const page = await context.newPage();
    pages.push(page);
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto('/');
    await page.getByLabel('Your nickname').fill(names[i]);
    await page.getByRole('button', { name: 'Join friends' }).click();
    await expect(page.getByText('Connected', { exact: true })).toBeVisible();
    if (i === 1)
      await expect(
        page.getByRole('button', { name: 'Everyone’s here · pick a host' }),
      ).toBeDisabled();
  }
  try {
    await expect(pages[1].locator('body')).toHaveJSProperty('scrollWidth', 390);
    await expect(
      pages[0].getByRole('button', { name: 'Everyone’s here · pick a host' }),
    ).toBeEnabled();
    await pages[0].getByRole('button', { name: 'Everyone’s here · pick a host' }).click();
    await expect.poll(async () => (await state(pages[0])).hostId).toBeTruthy();
    const initial = await Promise.all(pages.map((page) => state(page)));
    const ids = initial.map((v) => v.me.id);
    const hostIndex = ids.indexOf(initial[0].hostId!);
    const host = pages[hostIndex];
    const image = await readFile('ui-concepts/assets/sample-memory.jpg');
    for (const mode of MODES) {
      const card = host.getByRole('button', { name: new RegExp(MODE_INFO[mode].name) });
      if (playerCount === 3 && mode === 'quiz') {
        const guest = pages.find((page) => page !== host)!;
        await guest.goto('about:blank');
        await expect
          .poll(async () => (await state(host)).players.filter((p) => p.online).length)
          .toBe(2);
        await expect(card).toBeDisabled();
        await guest.goto('/');
        await expect(guest.getByText('Connected', { exact: true })).toBeVisible();
        await expect
          .poll(async () => (await state(host)).players.filter((p) => p.online).length)
          .toBe(3);
      }
      await expect(card).toBeEnabled();
      await card.click();
      await waitPhase(host, 'prepare');
      const prepared = (await state(host)).game!;
      expect(prepared.roster).toHaveLength(playerCount);
      expect(Object.values(prepared.scores)).toEqual(Array(playerCount).fill(0));
      let late: BrowserContext | undefined;
      if (mode === 'quiz') {
        late = await browser.newContext();
        const newcomer = await late.newPage();
        await newcomer.goto('/');
        await newcomer.getByLabel('Your nickname').fill('Sam');
        await newcomer.getByRole('button', { name: 'Join friends' }).click();
        await expect(
          newcomer.getByRole('heading', { name: 'You’re in for the next one.' }),
        ).toBeVisible();
        expect((await state(newcomer)).game?.assetId).toBeUndefined();
      }
      for (const page of pages) {
        await page.locator('#upload').setInputFiles({
          name: mode === 'voice' ? 'memory.wav' : 'memory.jpg',
          mimeType: mode === 'voice' ? 'audio/wav' : 'image/jpeg',
          buffer: mode === 'voice' ? recording() : image,
        });
        if (mode === 'quiz') await page.locator('#answer').fill('2023-06-10');
        if (mode === 'voice' || mode === 'chat' || mode === 'bluff')
          await page.locator('#answer').fill('We missed the last train.');
        if (mode === 'bluff')
          await page.locator('#false-story').fill('We won a singing competition.');
        if (mode === 'chat') {
          await page.getByRole('button', { name: 'Cover top' }).click();
          await page.getByRole('checkbox').check();
        }
        await page.getByRole('button', { name: 'My item is ready' }).click();
        await expect(
          page.getByText(`✓ Your ${MODE_INFO[mode].upload} is ready.`, { exact: true }),
        ).toBeVisible();
      }
      await expect(host.getByRole('button', { name: 'Start playing' })).toBeEnabled();
      await host.getByRole('button', { name: 'Start playing' }).click();
      for (let item = 0; item < playerCount; item++) {
        await waitPhase(
          host,
          mode === 'quiz' ? 'preview' : mode === 'impostor' ? 'discuss' : 'guess',
        );
        const current = await state(host);
        const owner = current.game!.ownerId!;
        if (mode === 'voice' && item === 0) {
          const probe = await host.request.get(`/api/media/${current.game!.assetId}`, {
            headers: { Range: 'bytes=0-1' },
          });
          expect(probe.status()).toBe(206);
          expect((await probe.body()).length).toBe(2);
        }
        if (mode === 'quiz') {
          await expect(host.getByRole('button', { name: 'Open guessing' })).toBeEnabled();
          await host.getByRole('button', { name: 'Open guessing' }).click();
          await waitPhase(host, 'guess');
          if (item === 1) {
            const before = (await state(pages[1])).me.id;
            await pages[1].reload();
            await expect(pages[1].getByText('Connected', { exact: true })).toBeVisible();
            expect((await state(pages[1])).me.id).toBe(before);
          }
        }
        if (mode === 'impostor') {
          const views = await Promise.all(pages.map((page) => state(page)));
          expect(views.filter((v) => v.game?.isImpostor)).toHaveLength(1);
          const impostor = ids[views.findIndex((v) => v.game?.isImpostor)];
          const privateMedia = await Promise.all(
            pages.map((page) => page.request.get(`/api/media/${views[0].game!.assetId}`)),
          );
          privateMedia.forEach((response) => expect(response.ok()).toBeTruthy());
          const bodies = await Promise.all(privateMedia.map((r) => r.body()));
          expect(
            bodies[ids.indexOf(impostor)].equals(bodies[ids.findIndex((id) => id !== impostor)]),
          ).toBeFalsy();
          await host.getByRole('button', { name: 'Skip to vote' }).click();
          for (let i = 0; i < pages.length; i++) {
            const target = ids[i] === impostor ? ids.find((id) => id !== impostor)! : impostor;
            await pages[i]
              .getByRole('button', { name: names[ids.indexOf(target)], exact: true })
              .click();
          }
        } else {
          for (let i = 0; i < pages.length; i++) {
            if (ids[i] === owner) continue;
            if (mode === 'bluff')
              await pages[i].getByRole('radio', { name: /We missed the last train/ }).check();
            else
              await pages[i]
                .locator('#guess')
                .fill(mode === 'quiz' ? '2023-06-10' : 'We missed the last train.');
            await pages[i]
              .getByRole('button', {
                name: mode === 'bluff' ? 'Lock choice' : 'Lock guess',
                exact: true,
              })
              .click();
          }
          if (mode === 'voice' || mode === 'chat') {
            for (let explanation = 0; explanation < playerCount - 1; explanation++) {
              await waitPhase(host, 'judge');
              const author = (await state(host)).game!.judgeAuthorId;
              for (let i = 0; i < pages.length; i++)
                if (ids[i] !== owner && ids[i] !== author)
                  await pages[i].getByRole('button', { name: 'Close enough', exact: true }).click();
            }
          }
        }
        await waitPhase(host, item === playerCount - 1 ? 'results' : 'reveal');
        if (item < playerCount - 1)
          await host.getByRole('button', { name: 'Next item', exact: true }).click();
      }
      for (const page of pages)
        await expect(
          page.getByText(`${MODE_INFO[mode].name} complete`, { exact: true }),
        ).toBeVisible();
      expect((await state(host)).game!.rankings).toHaveLength(playerCount);
      await expect(host.locator('.rankings li')).toHaveCount(playerCount);
      if (mode === 'impostor') {
        for (const page of pages) {
          await expect
            .poll(() =>
              page
                .locator('.last-reveal .photo-mount img')
                .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
            )
            .toBe(true);
        }
      }
      await late?.close();
    }
    expect(errors).toEqual([]);
    await host.screenshot({
      path:
        playerCount === 3
          ? 'output/playwright/final-ranking-3.png'
          : 'output/playwright/final-ranking.png',
      fullPage: true,
    });
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});
