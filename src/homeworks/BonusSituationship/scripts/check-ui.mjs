// Kiểm trên trình duyệt thật: không cuộn ngang ở 375px/320px, axe-core ở 3 trạng thái,
// thứ tự Tab bàn phím, nội dung vùng role="status". Lưu ảnh vào evidence/.
// Cần puppeteer-core và axe-core nhưng KHÔNG thêm vào package.json:
//   npm i --no-save puppeteer-core axe-core
// Chạy (sau `npm run build` và `npm run preview -- --port 4174`):
//   node scripts/check-ui.mjs [url] [đường dẫn trình duyệt]
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const url = process.argv[2] ?? 'http://localhost:4174/';
const browserPath = process.argv[3] ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const axeSource = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
mkdirSync('evidence', { recursive: true });

const browser = await puppeteer.launch({ executablePath: browserPath, headless: true });
const results = [];

async function runAxe(page, label) {
  await page.evaluate(axeSource);
  const out = await page.evaluate(() =>
    // eslint-disable-next-line no-undef
    axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } }),
  );
  results.push({
    check: `axe-core: ${label}`,
    passes: out.passes.length,
    violations: out.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
    ok: out.violations.length === 0,
  });
}

const clickByText = (page, text) =>
  page.evaluate((t) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === t).click(), text);

async function send(page, actor, steps) {
  await page.select('select', actor);
  await page.$eval('input[type=number]', (el) => { el.value = ''; });
  await page.type('input[type=number]', String(steps));
  await clickByText(page, 'Gửi tín hiệu');
}

// 1) Bố cục: không cuộn ngang (WCAG 1.4.10)
for (const width of [375, 320]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 812, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  const m = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  results.push({ check: `không cuộn ngang ở ${width}px (trạng thái đầu)`, ...m, ok: m.scrollWidth <= m.clientWidth });
  await page.close();
}

// 2) Luồng thật ở 375px: axe + status + ảnh
{
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await runAxe(page, 'FRIENDS (trạng thái đầu)');
  await page.screenshot({ path: 'evidence/375px-friends.png', fullPage: true });

  await clickByText(page, 'Rủ đi chơi');
  await send(page, 'EM', 100);
  await send(page, 'AI_DO', 1);
  const flagText = await page.$eval('output', (o) => o.textContent);
  results.push({ check: 'status hiện cờ đỏ khi em 10 < ai đó 50', text: flagText, ok: /Cờ đỏ/.test(flagText) });
  const w = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  results.push({ check: 'không cuộn ngang ở 375px khi có cờ đỏ + nhật ký', ...w, ok: w.scrollWidth <= w.clientWidth });
  await runAxe(page, 'DATING_NO_LOVE + cờ đỏ');
  await page.screenshot({ path: 'evidence/375px-red-flag.png', fullPage: true });

  await clickByText(page, 'Dừng Lại');
  await runAxe(page, 'GHOSTED_EXIT (form bị khoá)');
  await page.screenshot({ path: 'evidence/375px-ghosted.png', fullPage: true });

  // Accessibility tree: tên + role của output và các nút
  const tree = await page.accessibility.snapshot({ interestingOnly: true });
  writeFileSync('evidence/a11y-tree.json', JSON.stringify(tree, null, 2));
  await page.close();
}

// 3) Bàn phím: Tab đi qua mọi điều khiển theo thứ tự đọc, focus nhìn thấy được
{
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await clickByText(page, 'Rủ đi chơi');
  await page.evaluate(() => document.activeElement.blur());
  const order = [];
  // 6 điều khiển còn bật sau "Rủ đi chơi": Official, Dừng Lại, Reset, select, input, Gửi tín hiệu.
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press('Tab');
    order.push(await page.evaluate(() => {
      const el = document.activeElement;
      const outline = getComputedStyle(el).outlineStyle;
      return { tag: el.tagName, name: el.getAttribute('aria-label') ?? el.textContent.trim().slice(0, 20) ?? '', outline };
    }));
  }
  const names = order.map((o) => o.tag + ':' + o.name);
  const expected = ['BUTTON', 'BUTTON', 'BUTTON', 'SELECT', 'INPUT', 'BUTTON'];
  results.push({
    check: 'thứ tự Tab theo thứ tự đọc, mỗi điều khiển có outline focus',
    order: names,
    ok: order.every((o, i) => o.tag === expected[i] && o.outline === 'solid'),
  });
  await page.close();
}

// 4) Cleanup timer trong trình duyệt thật: em nhắn, 5s không ai rep thì bị bỏ rơi
{
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await clickByText(page, 'Rủ đi chơi');
  await send(page, 'EM', 3);
  const t0 = Date.now();
  await page.waitForFunction(() => document.querySelector('main strong')?.textContent === 'Đã bị bỏ rơi', { timeout: 8000 });
  const ms = Date.now() - t0;
  results.push({ check: 'seen không rep: bị bỏ rơi sau ~5s', ms, ok: ms >= 4500 && ms <= 6500 });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
process.exit(results.every((r) => r.ok) ? 0 : 1);
