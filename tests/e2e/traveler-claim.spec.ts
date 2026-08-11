import { expect, test } from '@playwright/test';
test('claim page explains the one-time persistent identity contract', async ({ page }) => { await page.goto('/login'); await expect(page.getByRole('heading', { name: '回到你的思考足迹' })).toBeVisible(); await expect(page.getByLabel('旅人编号')).toBeVisible(); await expect(page.getByLabel('密码')).toBeVisible(); });
