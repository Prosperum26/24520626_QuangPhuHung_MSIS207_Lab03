# Bằng chứng kiểm chứng HW1 (H1-D, H1-08, H1-09)

Tệp này ghi lại cái gì đã kiểm, kiểm bằng cách nào, và cái gì còn phải kiểm tay. Chỉ đánh dấu một mục khi đã có tệp bằng chứng thật trong thư mục này.

## Đã có

| Mục | Cách kiểm | Tệp |
|---|---|---|
| Tương phản màu (WCAG 1.4.3, 1.4.11) | `node scripts/check-contrast.mjs` đọc màu từ `src/styles/tokens.css`; 16/16 cặp đạt, thấp nhất 6.24:1 (chữ trên pad Kick) | [contrast.txt](contrast.txt) |
| Logic bàn phím, `aria-pressed`, nhật ký, meter | `npm test` (Vitest + jsdom) | chạy lại lệnh để xem |

## Cần chạy trong trình duyệt

Chuẩn bị (trong folder `src/homeworks/DrumMachine`):

```bash
npm run build
npm run preview -- --port 4173
```

### Lighthouse Accessibility (H1-09)

Mở terminal thứ hai. Máy chỉ có Edge nên chỉ `CHROME_PATH` tới Edge:

```bash
CHROME_PATH="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
npx lighthouse http://localhost:4173/ --only-categories=accessibility \
  --output=json --output=html --output-path=evidence/lighthouse-a11y \
  --chrome-flags="--headless=new"
```

Kết quả: `evidence/lighthouse-a11y.report.json` và `.report.html`. Ghi điểm vào bảng dưới.

### Kiểm tay

| Mục | Cách làm | Kết quả | Ảnh |
|---|---|---|---|
| Tab hết trang (2.1.1, 2.4.7) | Bấm Tab từ đầu trang qua 7 pad; mỗi pad có khung focus đậm quanh ô; Enter/Space trên pad phát tiếng | | `tab-focus.png` |
| 375px không cuộn ngang (1.4.10) | DevTools > Device toolbar > 375 × 812, gõ liên tục L (crash, sóng rộng nhất) và xem có thanh cuộn ngang | | `375px.png` |
| Accessibility tree (4.1.2) | DevTools > Elements > Accessibility: pad có tên "Kick A", role button, pressed true/false | | `a11y-tree.png` |
| Hit log (4.1.3) | Gõ dồn 3 phím: `<output>` đọc một câu "3 cú gõ, cuối cùng: ..." sau khoảng 0,5 giây | | `hit-log.png` |
| UniKey | Bật UniKey kiểu Telex, gõ W A S D: pad vẫn kêu (dùng `e.code`) | | ghi chú |
| Gõ trong ô nhập không kích hoạt pad | Hiện chưa có ô nhập; kiểm lại sau H1-12 (Controls) | | |
| Giảm chuyển động (2.3.3) | DevTools > Rendering > Emulate `prefers-reduced-motion: reduce`: không còn animation, pad vẫn lún khi bấm | | `reduced-motion.png` |
| Console | Mở Console, gõ mỗi pad một lần: không có lỗi hay cảnh báo | | `console.png` |
| Âm thanh | Nghe đủ 7 pad; giữ phím không bắn lặp; hi-hat (D) cắt tiếng open hat (W) | | ghi chú |

Lighthouse: điểm Accessibility = ___ (ngày ___).

## Phải kiểm lại

Sau H1-12 đến H1-15 (Controls, Looper) phải chạy lại Lighthouse và kiểm 375px, vì có thêm ô nhập và nút mới.
