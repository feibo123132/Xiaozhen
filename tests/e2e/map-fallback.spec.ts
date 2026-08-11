import { expect, test } from '@playwright/test';
test('semantic worry list remains usable when the map image is blocked', async ({ page }) => { await page.route('**/town-map.svg', (route) => route.abort()); await page.goto('/town'); const list = page.getByRole('region', { name: '烦恼列表' }); await expect(list).toBeVisible(); await expect(list.getByRole('link')).toHaveCount(10); });
