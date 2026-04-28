const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const url = 'http://localhost:4173/search?q=new';
  console.log('Navigating to ' + url);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  let results = { tabCounts: false, ageFilter: false, chipQuery: false };

  // 1) Tab labels counts - using more generic selectors
  const tabsText = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('button, a, div')).filter(el => 
        el.innerText && /\(\d+\)/.test(el.innerText)
    );
    return elements.map(el => el.innerText).join(' | ');
  });
  console.log('Tabs text found: ' + tabsText);
  if (/\(\d+\)/.test(tabsText)) results.tabCounts = true;

  // 2) Age filter
  const r18Label = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label, button, span')).find(el => 
      el.innerText.includes('R-18')
    );
    if (labels) {
      labels.click();
      return labels.innerText;
    }
    return null;
  });
  console.log('R-18 Label found: ' + r18Label);
  await page.waitForTimeout(1000);
  console.log('URL after R-18 click: ' + page.url());
  if (page.url().includes('age=r18')) results.ageFilter = true;

  // 3) Tag chip
  const chipResult = await page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll('[class*=\"chip\"], [class*=\"Chip\"]')).filter(el => 
        !el.innerText.includes('All-Ages') && !el.innerText.includes('R-18')
    );
    if (chips.length > 0) {
      const text = chips[0].innerText;
      chips[0].click();
      return text;
    }
    return null;
  });
  console.log('Chip clicked: ' + chipResult);
  await page.waitForTimeout(1000);
  console.log('URL after chip click: ' + page.url());
  const searchParams = new URL(page.url()).searchParams;
  if (searchParams.get('q') && searchParams.get('q') !== 'new') results.chipQuery = true;

  await page.screenshot({ path: 'E:/HocTap/CT550/test-artifacts/screenshots/messages/search-improved-ui-2026-04-27.png', fullPage: true });
  console.log('RESULTS:', JSON.stringify(results));
  await browser.close();
})();
