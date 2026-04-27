import { test, expect } from '@playwright/test';

test('validate search panel tags', async ({ page }) => {
  await page.goto('http://localhost:5176/');
  
  // Wait for the UI to be ready
  await page.waitForTimeout(5000);

  // Check for the specific texts directly without clicking
  const favTags = page.getByText('Your favorite tags');
  const illustTags = page.getByText('Popular illust tags');
  const novelTags = page.getByText('Popular novel tags');

  // Take a screenshot of the whole page
  await page.screenshot({ path: 'e:/HocTap/CT550/test-artifacts/screenshots/messages/search-panel-tags-2026-04-27.png', fullPage: true });

  await expect(favTags).toBeVisible();
  await expect(illustTags).toBeVisible();
  await expect(novelTags).toBeVisible();
});
