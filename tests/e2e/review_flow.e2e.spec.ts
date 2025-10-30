import { test, expect } from '@playwright/test';

test.describe('Review flow E2E', () => {
  test('allows creating a card and viewing the review queue', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Create Card' }).click();
    await expect(page.getByText('Live Preview')).toBeVisible();
    await expect(page.getByLabel('Word')).toBeVisible();

    await page.getByRole('button', { name: 'Review Words' }).click();
    await expect(page.getByText('Memory Strength')).toBeVisible();
    await expect(page.getByText(/Cards awaiting review:/)).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Memory Level' })).toBeVisible();
  });
});
