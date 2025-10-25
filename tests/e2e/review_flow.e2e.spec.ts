import { test, expect } from '@playwright/test';

test.describe('Review flow E2E', () => {
  test('allows creating a card and viewing the review queue', async ({ page }) => {
    await page.goto('/');

    await page.getByText('SVG 源码').waitFor();

    const svg_markup =
      '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#1d4ed8"/><text x="12" y="48" fill="#f8fafc">Playwright</text></svg>';

    const svg_input = page.locator('textarea[name="svg"]');
    await svg_input.fill(svg_markup);
    await expect(page.getByText('自动保存中...')).toBeVisible();
    await expect(page.getByText('已自动保存')).toBeVisible();

    await page.getByRole('button', { name: '复习单词' }).click();
    await expect(page.getByText('记忆强度')).toBeVisible();
    await expect(page.getByText(/待复习队列：\d+ 张/)).toBeVisible();
    await expect(page.getByText('标记为「熟知」')).toBeVisible();
  });
});
