// Chụp bằng chứng 409 rollback (H3-10) trên Edge/Chrome thật.
// API giả có RIVAL_CHANCE = 35% đối thủ lấy suất trước, nên script bấm Claim ở crate đầu
// cho tới khi thấy role="alert", ghi số kho trước/trong lúc chờ/sau khi rollback và chụp ảnh.
// Cần puppeteer-core nhưng KHÔNG thêm vào package.json:  npm i --no-save puppeteer-core
// Chạy (sau `npm run build` và `npm run preview -- --port 4173`):
//   node scripts/capture-409.mjs [url] [đường dẫn trình duyệt]
import puppeteer from 'puppeteer-core';

const url = process.argv[2] ?? 'http://localhost:4173/';
const browserPath = process.argv[3] ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const browser = await puppeteer.launch({ executablePath: browserPath, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle0' });

const card = '(() => [...document.querySelectorAll("article")][0])()';
const stockOf = () => page.evaluate(`${card}.querySelector("dl dd:nth-of-type(2)").textContent`);
const claimEnabled = () => page.waitForFunction(`(() => { const b = ${card}.querySelector("button"); return b && !b.disabled; })()`, { timeout: 60_000 });

// Chờ tới giờ drop (20 giây sau khi tải trang) rồi bấm Claim.
await claimEnabled();
const steps = [];
let captured = false;
for (let attempt = 1; attempt <= 5 && !captured; attempt += 1) {
  const before = await stockOf();
  await page.evaluate(`${card}.querySelector("button").click()`);
  const during = await stockOf(); // kho đã giảm ngay (lạc quan) trước khi server trả lời
  await page.waitForFunction(`(() => { const c = ${card}; return c.querySelector('[role="alert"]') || c.textContent.includes("Đã giữ chỗ"); })()`, { timeout: 10_000 });
  const alertText = await page.evaluate(`${card}.querySelector('[role="alert"]')?.textContent ?? null`);
  const after = await stockOf();
  steps.push({ attempt, before, during, after, alert: alertText });
  if (alertText) {
    await page.screenshot({ path: 'evidence/409-rollback.png', fullPage: true });
    captured = true;
  } else {
    await claimEnabled().catch(() => {});
  }
}

await browser.close();
const hit409 = steps.find((s) => s.alert);
const report = { steps, ok: Boolean(hit409) && hit409.after === hit409.before && Number(hit409.during) === Number(hit409.before) - 1 };
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
