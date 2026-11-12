// Đo drift của đồng hồ khi tab bị đưa xuống nền (H3-10) trên Edge/Chrome thật.
// Cách đo: mở app ở tab A, mở tab B và đưa B lên trước để A thành tab nền, chờ N giây,
//   (1) đọc số đồng hồ đang HIỂN THỊ ở A khi còn ở nền: lệch bao nhiêu so với giờ thật,
//   (2) đưa A lên lại và đọc ngay: lệch bao nhiêu (hook phải đúng ngay nhờ visibilitychange).
// Cần puppeteer-core nhưng KHÔNG thêm vào package.json:  npm i --no-save puppeteer-core
// Chạy (sau `npm run build` và `npm run preview -- --port 4173`):
//   node scripts/measure-drift.mjs [giây ở nền, mặc định 70] [url] [đường dẫn trình duyệt]
// Cờ --headful mở cửa sổ thật (headless có thể không đưa tab xuống trạng thái hidden).
import puppeteer from 'puppeteer-core';

const hiddenSeconds = Number(process.argv[2] ?? 70);
const url = process.argv[3] ?? 'http://localhost:4173/';
const browserPath = process.argv[4] ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const headful = process.argv.includes('--headful');

const browser = await puppeteer.launch({ executablePath: browserPath, headless: !headful });
const pageA = await browser.newPage();
await pageA.goto(url, { waitUntil: 'networkidle0' });
// Đối chứng: bộ đếm kiểu lỗi `setInterval(() => n + 1, 1000)`. Nếu tab nền thật sự bị throttle thì n << số giây đã trôi.
await pageA.evaluate(() => {
  window.__naiveTicks = 0;
  window.setInterval(() => { window.__naiveTicks += 1; }, 1000);
});

/** Crate thứ 3 (drop sau 10 phút): đọc chuỗi "mm:ss" đang hiển thị, đổi ra giây. */
const readDisplayedSeconds = () =>
  pageA.evaluate(() => {
    const card = [...document.querySelectorAll('article')].find((a) => a.textContent.includes('Contraband'));
    const [mm, ss] = card.querySelector('output').textContent.split(':').map(Number);
    return { seconds: mm * 60 + ss, text: card.querySelector('output').textContent, visibility: document.visibilityState, now: Date.now() };
  });

// Mốc thật: đọc ngay sau khi tải (tab còn hiển thị, hook chắc chắn đúng), rồi suy ra giây còn lại theo đồng hồ thật.
const anchor = await readDisplayedSeconds();
const trueRemaining = (now) => Math.ceil(anchor.seconds - (now - anchor.now) / 1000);

const pageB = await browser.newPage();
await pageB.bringToFront();
await new Promise((r) => setTimeout(r, 1000));
const afterSwitch = await readDisplayedSeconds();

await new Promise((r) => setTimeout(r, hiddenSeconds * 1000));
const hidden = await readDisplayedSeconds();
await pageA.bringToFront();
const naiveTicks = await pageA.evaluate(() => window.__naiveTicks);
const woke = await readDisplayedSeconds();

const report = {
  hiddenSeconds,
  visibilityAfterSwitch: afterSwitch.visibility,
  visibilityWhileHidden: hidden.visibility,
  naiveTicksExpected: hiddenSeconds,
  naiveTicksActual: naiveTicks,
  whileHidden: { displayed: hidden.text, expectedSeconds: trueRemaining(hidden.now), driftSeconds: hidden.seconds - trueRemaining(hidden.now) },
  afterWake: { displayed: woke.text, expectedSeconds: trueRemaining(woke.now), driftSeconds: woke.seconds - trueRemaining(woke.now) },
};
report.ok = report.visibilityWhileHidden === 'hidden' && Math.abs(report.afterWake.driftSeconds) <= 1;
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(report.ok ? 0 : 1);
