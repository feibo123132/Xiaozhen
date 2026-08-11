import { expect, test } from '@playwright/test';
test('public pages never offer anonymous posting or expose admin authorization notes', async ({ page }) => { await page.goto('/worries/leave-or-stay'); await expect(page.getByRole('textbox')).toHaveCount(0); await expect(page.getByText('演示种子内容')).toHaveCount(0); await expect(page.getByRole('link', { name: /晚风/ })).toBeVisible(); });
