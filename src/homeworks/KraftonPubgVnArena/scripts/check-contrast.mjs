// Kiểm tương phản WCAG 2.2 (1.4.3 chữ >= 4.5:1, 1.4.11 thành phần >= 3:1) cho các cặp màu
// thật sự dùng trong app. Đọc màu thẳng từ src/styles/tokens.css nên đổi token là kiểm lại được.
// Chạy: node scripts/check-contrast.mjs   (thoát mã 1 nếu có cặp không đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const PHASES = ['warmup', 'live', 'looted', 'expired'];
const TEXT = 4.5;
const UI = 3;

/** [mô tả, màu chữ/viền, màu nền, ngưỡng] */
const pairs = [
  ['Chữ chính trên nền trang', 'ink', 'paper', TEXT],
  ['Chữ chính trên thẻ/panel', 'ink', 'surface', TEXT],
  ['Chữ phụ trên nền trang', 'ink-soft', 'paper', TEXT],
  ['Chữ phụ trên thẻ/panel', 'ink-soft', 'surface', TEXT],
  ...PHASES.map((p) => [`Chữ trên chip phase ${p}`, 'ink', p, TEXT]),
  ['Chữ nút Claim trên nền accent', 'ink', 'accent', TEXT],
  ['Chữ nút Claim bị vô hiệu (ink-soft) trên nền paper', 'ink-soft', 'paper', TEXT],
  ['Chữ tiêu đề cột đang sắp xếp trên nền accent', 'ink', 'accent', TEXT],
  ['Chữ thông báo lỗi trên nền looted', 'ink', 'looted', TEXT],
  ['Viền thẻ, viền panel, viền focus trên nền trang', 'ink', 'paper', UI],
  ['Viền ô nhập/ô chọn trên panel', 'ink', 'surface', UI],
];

let failed = 0;
for (const [label, fg, bg, min] of pairs) {
  if (!tokens[fg] || !tokens[bg]) throw new Error(`Thiếu token --${fg} hoặc --${bg}`);
  const r = ratio(tokens[fg], tokens[bg]);
  const ok = r >= min;
  if (!ok) failed += 1;
  console.log(`${ok ? 'ĐẠT ' : 'TRƯỢT'} ${r.toFixed(2).padStart(5)}:1 (cần ${min}) ${label}  --${fg} ${tokens[fg]} / --${bg} ${tokens[bg]}`);
}
console.log(failed === 0 ? '\nTất cả cặp đạt.' : `\n${failed} cặp không đạt.`);
process.exit(failed === 0 ? 0 : 1);
