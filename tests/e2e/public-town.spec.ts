import { expect, test } from '@playwright/test';

test('visitor moves from the current roadshow into the full town and a worry', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '今晚，认真谈一会儿' })).toBeVisible();
  await page.getByRole('link', { name: /进入完整小镇/ }).click();
  await expect(page.getByLabel('解忧小镇地图')).toBeVisible();
  await page.getByRole('region', { name: '烦恼列表' }).getByRole('link').first().click();
  await expect(page.getByText(/个回答认真看见/)).toBeVisible();
});

test('town works at 360px, by keyboard, and with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 }); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/town');
  await page.keyboard.press('Tab'); await expect(page.locator(':focus')).toBeVisible();
  await expect(page.getByRole('heading', { name: /每个烦恼/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
