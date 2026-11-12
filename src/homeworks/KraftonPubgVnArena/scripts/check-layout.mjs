// Đo bố cục bằng Edge/Chrome thật: cuộn ngang ở 375px và 320px (WCAG 1.4.10), prefers-reduced-motion.
// Cần puppeteer-core nhưng KHÔNG thêm vào package.json:  npm i --no-save puppeteer-core
// Chạy (sau `npm run build` và `npm run preview -- --port 4173`):
//   node scripts/check-layout.mjs [url] [đường dẫn trình duyệt]
import puppeteer from 'puppeteer-core';

const url = process.argv[2] ?? 'http://localhost:4173/';
const browserPath = process.argv[3] ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const browser = await puppeteer.launch({ executablePath: browserPath, headless: true });
const results = [];

for (const width of [375, 320]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 812, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    articles: document.querySelectorAll('article').length,
    tableWidth: document.querySelector('table')?.getBoundingClientRect().width ?? null,
  }));
  results.push({ check: `không cuộn ngang ở ${width}px`, ...metrics, ok: metrics.scrollWidth <= metrics.clientWidth });
  if (width === 375) await page.screenshot({ path: 'evidence/375px.png', fullPage: true });
  await page.close();
}

// Giảm chuyển động: nút Claim không còn transition khi người dùng bật reduce.
for (const motion of ['no-preference', 'reduce']) {
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: motion }]);
  await page.setViewport({ width: 375, height: 812 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  const transitionDuration = await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Claim');
    return getComputedStyle(button).transitionDuration;
  });
  results.push({ check: `transition của nút Claim khi ${motion}`, transitionDuration, ok: motion === 'reduce' ? transitionDuration === '0s' : transitionDuration !== '0s' });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
process.exit(results.every((r) => r.ok) ? 0 : 1);
