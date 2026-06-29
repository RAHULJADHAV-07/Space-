import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise((r) => setTimeout(r, 5000));
const top = await page.evaluate(() => document.querySelector('#flight').offsetTop);
await page.evaluate((y) => window.scrollTo({ top: y + 300 }), top);
await new Promise((r) => setTimeout(r, 1800));
await page.screenshot({ path: '/tmp/avita-plane1.png' });
await page.evaluate((y) => window.scrollTo({ top: y + 800 }), top);
await new Promise((r) => setTimeout(r, 1800));
await page.screenshot({ path: '/tmp/avita-plane2.png' });
console.log('errors:', JSON.stringify(errors));
await browser.close();
