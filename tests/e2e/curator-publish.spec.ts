import { expect, test } from '@playwright/test';

test('curator signs in and saves a worry as a private draft', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('主理人账号').fill('curator');
  await page.getByLabel('密码').fill('e2e-curator-password');
  await page.getByRole('button', { name: '进入后台' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/worries');
  await page.getByLabel('短链接').fill(`e2e-question-${Date.now()}`);
  await page.getByLabel('标题').fill('测试中的真实问题');
  await page.getByLabel('烦恼正文').fill('这是一条只应保存为草稿的问题。');
  await page.getByLabel('生命素材').selectOption({ index: 1 });
  await page.getByRole('button', { name: '保存为草稿' }).click();
  await expect(page.getByRole('status')).toContainText('草稿已保存');
});
