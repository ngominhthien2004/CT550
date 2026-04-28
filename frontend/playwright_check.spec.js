import { test, expect } from '@playwright/test';

test('verify sidebar and search results on search page', async ({ page }) => {
  await page.goto('http://localhost:5174/search?q=new');
  
  // Wait for initial load
  await page.waitForLoadState('networkidle');

  // Verify Sidebar from MainLayoutTemplate (aside.left-nav)
  const sidebar = page.locator('aside.left-nav');
  await expect(sidebar).toBeVisible();

  // Verify Search Result Header (header.result-header h1)
  const header = page.locator('header.result-header h1');
  await expect(header).toContainText('new');

  // Verify Search Result Tabs (nav.result-tabs)
  const tabs = page.locator('nav.result-tabs');
  await expect(tabs).toBeVisible();
  
  const tabItems = page.locator('nav.result-tabs .tab-item');
  const count = await tabItems.count();
  console.log('Found ' + count + ' tab items');
  await expect(count).toBeGreaterThan(0);
});
