# Bằng chứng kiểm chứng HW1 (H1-D, H1-08, H1-09)

Tệp này ghi lại cái gì đã kiểm, kiểm bằng cách nào, và cái gì còn phải kiểm tay. Chỉ đánh dấu một mục khi đã có tệp bằng chứng thật trong thư mục này.

## Đã có

| Mục | Cách kiểm | Tệp |
|---|---|---|
| Tương phản màu (WCAG 1.4.3, 1.4.11) | `node scripts/check-contrast.mjs` đọc màu từ `src/styles/tokens.css`; 16/16 cặp đạt, thấp nhất 6.24:1 (chữ trên pad Kick) | [contrast.txt](contrast.txt) |
| Logic bàn phím, `aria-pressed`, nhật ký, meter | `npm test` (Vitest + jsdom) | chạy lại lệnh để xem |
| Lighthouse trong DevTools (Edge/Chrome) | Panel Lighthouse chạy trên `http://localhost:5173/` (Vite dev server), có đủ Controls và Looper. Điểm đọc từ ảnh lúc 08:25:29: Performance 69, **Accessibility 100**, Best Practices 100, SEO 91 | [lighthouse-devtools.png](lighthouse-devtools.png) |
| Accessibility tree (vùng Looper) | DevTools > Elements > Accessibility: `region "Looper"` chứa `status` (atomic), `button "Ghi"` (role button, Pressed: false), các nút Phát, Chồng lớp, Xoá ở trạng thái disabled, `progressbar "Vị trí trong vòng"` (0-100), `group "Chế độ phát"` | [a11y-tree-looper.png](a11y-tree-looper.png) |

| Lighthouse: chỉ số Performance (dev server) | First Contentful Paint 2.1 s, Largest Contentful Paint 3.6 s, Total Blocking Time 0 ms, Cumulative Layout Shift 0, Speed Index 2.1 s | [lighthouse-metrics-devtools.png](lighthouse-metrics-devtools.png) |
| Lighthouse: insight và diagnostics (dev server) | Render-blocking requests (ước tính tiết kiệm 160 ms), Forced reflow, Network dependency tree, 3rd parties; Minify JavaScript 2,959 KiB, Reduce unused JavaScript 1,366 KiB, payload 4,186 KiB | [lighthouse-insights-devtools.png](lighthouse-insights-devtools.png) |

Ghi chú về các bằng chứng trên:

- Lighthouse chạy trên **dev server** (cổng 5173), không phải bản build (`npm run preview`, cổng 4173). Các mục Minify JavaScript, Reduce unused JavaScript và User Timing là đặc trưng của bản dev. Các mục Render-blocking requests, Network dependency tree và 3rd parties đến từ stylesheet Google Fonts mà AI đã thêm; ghi ở Lỗi 5 của [AI_FAILURE_AUDIT.md](../../../../AI_FAILURE_AUDIT.md).
- Đã sửa trong code (chưa đo lại bằng Lighthouse): font tự phục vụ + preload, bỏ ba thẻ Google, dời tải trước WAV sang lúc rảnh. Điểm sau sửa phải đo trên bản build và ghi vào bảng; điểm 69 ở trên là **trước** khi sửa.
- Forced reflow chưa rõ nguyên nhân. Nếu vẫn còn sau khi đo trên bản build, mở insight đó trong Lighthouse để xem dòng mã gây ra.
- Mới có ảnh chụp, **chưa có file JSON** của Lighthouse (gate H1-09 yêu cầu JSON). Trong panel Lighthouse: nút ⋮ > Save as JSON, lưu thành `evidence/lighthouse-a11y.report.json`.
- Ảnh a11y tree là vùng Looper, chưa phải pad. Gate H1-04 (pad có tên và `aria-pressed`) cần thêm một ảnh chọn nút "Kick A" trong cây.

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
| Gõ trong ô chọn không kích hoạt pad | Focus vào ô "Bộ trống" (select), gõ A: pad không kêu. Sau đó bấm "Tắt tiếng" (checkbox) rồi gõ A: pad vẫn kêu | | |
| Đổi bộ trống | Chọn Electronic 808, gõ 7 pad: tiếng khác Acoustic; hi-hat (D) vẫn cắt open hat (W) | | ghi chú |
| Âm lượng và tắt tiếng | Kéo thanh Âm lượng: tiếng nhỏ dần, thanh Mức âm thấp đi; bật Tắt tiếng: im, Mức âm về Im lặng. Trình đọc màn hình không đọc từng bước khi kéo | | |
| Looper: ghi và lặp | Bấm Ghi, gõ khoảng 4 hit, bấm Ghi lần nữa: loop tự lặp. Để chạy 1 phút, nhịp không trôi (nghe cùng một khuôn) | | ghi chú |
| Looper: chồng lớp | Bấm Chồng lớp khi đang lặp, gõ thêm một hit: vòng sau có thêm hit, vòng hiện tại không bị đúp. Bấm lại để tắt | | |
| Looper: chế độ và tốc độ | Chọn Một lần: hết vòng thì dừng, Phát chơi lại. Kéo Tốc độ khi đang lặp: nhanh/chậm lên mà nhịp không nhảy vị trí | | |
| Looper: bàn phím | Tab qua Ghi, Phát, Chồng lớp, Xoá, radio, thanh Tốc độ; nút bị vô hiệu có viền nét đứt; trạng thái đọc ở vùng status | | `looper.png` |
| Giảm chuyển động (2.3.3) | DevTools > Rendering > Emulate `prefers-reduced-motion: reduce`: không còn animation, pad vẫn lún khi bấm | | `reduced-motion.png` |
| Console | Mở Console, gõ mỗi pad một lần: không có lỗi hay cảnh báo | | `console.png` |
| Âm thanh | Nghe đủ 7 pad; giữ phím không bắn lặp; hi-hat (D) cắt tiếng open hat (W) | | ghi chú |

Lighthouse Accessibility: **100** (DevTools, dev server 5173, theo ảnh [lighthouse-devtools.png](lighthouse-devtools.png)). Còn phải chạy lại trên bản build và lưu JSON.

## Phải kiểm lại

Sau H1-12 đến H1-15 (Controls, Looper) phải chạy lại Lighthouse và kiểm 375px, vì có thêm ô nhập và nút mới.
