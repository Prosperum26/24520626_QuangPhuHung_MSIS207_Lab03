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

const SOUNDS = ['kick', 'snare', 'hihat', 'openhat', 'tom', 'clap', 'crash'];
const TEXT = 4.5;
const UI = 3;

/** [mô tả, màu chữ/viền, màu nền, ngưỡng] */
const pairs = [
  ['Chữ chính trên nền trang', 'ink', 'paper', TEXT],
  ['Chữ chính trên panel', 'ink', 'surface', TEXT],
  ['Chữ phụ trên nền trang', 'ink-soft', 'paper', TEXT],
  ['Chữ phụ trên panel', 'ink-soft', 'surface', TEXT],
  ...SOUNDS.map((s) => [`Chữ trên pad/chip ${s}`, 'ink', s, TEXT]),
  ['Viền pad, viền panel, viền focus trên nền trang', 'ink', 'paper', UI],
  ['Vạch meter đang tắt (viền) trên panel', 'ink-soft', 'surface', UI],
  ...['hihat', 'snare', 'kick'].map((s) => [`Vạch meter bật (${s}) cạnh vạch tắt trên panel: viền ink`, 'ink', s, UI]),
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
