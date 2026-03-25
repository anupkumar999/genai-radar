const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  page.on('response', response => {
    if (!response.ok()) {
      console.log('PAGE HTTP ERROR:', response.url(), response.status());
    }
  });

  await page.goto('https://heroic-mooncake-f1dba9.netlify.app/', { waitUntil: 'networkidle2' });
  
  // Get main content
  const content = await page.content();
  console.log("HTML length:", content.length);
  
  await browser.close();
})();