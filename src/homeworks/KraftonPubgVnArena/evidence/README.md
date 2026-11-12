# Bằng chứng kiểm chứng HW3 (H3-09, H3-10)

Tệp này ghi cái gì đã kiểm, kiểm bằng cách nào, và cái gì bạn còn phải chụp tay. Chỉ đánh dấu một mục khi đã có tệp bằng chứng thật trong thư mục này.

## Đã có (đo tự động trên Edge thật, không phải DevTools)

Các script nằm ở [scripts/](../scripts/). Script dùng trình duyệt cần `npm i --no-save puppeteer-core` (không ghi vào `package.json`), và chạy trên bản build:

```bash
npm run build
npm run preview -- --port 4173
```

| Mục | Cách kiểm | Kết quả | Tệp |
|---|---|---|---|
| Tương phản màu (WCAG 1.4.3, 1.4.11) | `node scripts/check-contrast.mjs` đọc màu từ `src/styles/tokens.css` | 14/14 cặp đạt, thấp nhất 6.24:1 (chữ trên chip Hết hàng) | [contrast.txt](contrast.txt) |
| Không cuộn ngang ở 375px và 320px (1.4.10) | `node scripts/check-layout.mjs`: so `scrollWidth` với `clientWidth` | 375 = 375 và 320 = 320, đạt | [layout-check.txt](layout-check.txt), [375px.png](375px.png) |
| Giảm chuyển động (2.3.3) | cùng script, emulate `prefers-reduced-motion` | transition nút Claim: `0.07s` khi bình thường, `0s` khi reduce | [layout-check.txt](layout-check.txt) |
| Lighthouse (CLI, mobile, bản build) | `npx lighthouse http://localhost:4173/` với Edge headless | Performance 100, **Accessibility 100**, Best Practices 100; không có audit a11y nào chưa đạt | [lighthouse.report.json](lighthouse.report.json), [lighthouse.report.html](lighthouse.report.html) |
| 409 rollback trên trình duyệt thật | `node scripts/capture-409.mjs`: bấm Claim đến khi gặp 409 | Kho 1 → 0 (lạc quan) → 1 (rollback) và `role="alert"` hiện chữ | [409-rollback.json](409-rollback.json), [409-rollback.png](409-rollback.png) |
| Drift khi tab nền | `node scripts/measure-drift.mjs <giây>` | Hook đúng ở tab nền 330 giây (drift 0), **nhưng chưa chứng minh được throttle**: xem "Kết quả đo drift" | [drift-330s.json](drift-330s.json) |
| Logic hook, claim, bảng xếp hạng | `npm test` (Vitest + jsdom), chạy trong folder bài | 61 test pass | chạy lại lệnh để xem |

Lưu ý về giới hạn:

- Lighthouse ở đây chạy bằng CLI (Edge headless, giả lập mobile). Rubric muốn bằng chứng từ DevTools nên bạn nên chụp thêm ảnh panel Lighthouse (mục 1 bên dưới).
- Với API giả, 409 chỉ xảy ra khi đối thủ "lấy trước" (xác suất 35% mỗi lần bấm) hoặc kho server đã hết. Sau 409 kho hiển thị quay về giá trị cũ theo slide, nên có thể thấy "Còn lại 1" dù server đã hết; bấm tiếp sẽ nhận 409 nữa.

## Kết quả đo drift

Chạy `node scripts/measure-drift.mjs 330` trên Edge headless. Tab A hiển thị crate "G-Coin Contraband Crate" (đếm ngược 10 phút) và bị đưa xuống nền 330 giây bằng cách mở và đưa tab B lên trước:

- `document.visibilityState` của tab A là `hidden` suốt thời gian đo.
- Số đang hiển thị lúc còn ở nền và ngay sau khi quay lại đều là `04:29`, lệch **0 giây** so với giờ thật.
- **Đối chứng thất bại**: bộ đếm kiểu lỗi `setInterval(n + 1, 1000)` đếm được 331 trên 330 giây, tức là Edge headless **không throttle** tab nền. Vì vậy kết quả drift 0 này không chứng minh được hook chống drift tốt hơn cách làm sai; nó chỉ cho thấy hook không sai khi không bị throttle.
- Lần chạy đầu (không có đối chứng) cho cùng kết quả: [drift-330s-run1-no-control.json](drift-330s-run1-no-control.json).

Vì vậy mục H3-10 (đo drift) **chưa đạt**. Để có bằng chứng thật, bạn cần tự đo trên Edge có cửa sổ (mục 2 bên dưới), hoặc chạy `node scripts/measure-drift.mjs 330 --headful` (mở cửa sổ Edge thật khoảng 5,5 phút) và giữ kết quả nếu `naiveTicksActual` thấp hơn `naiveTicksExpected` rõ rệt.

## Cần bạn chụp tay (DevTools proof)

Làm trên bản build (`npm run preview -- --port 4173`), mở `http://localhost:4173/` bằng Edge. Lưu ảnh vào thư mục này đúng tên bên dưới, rồi ghi ghi chú vào [AI_FAILURE_AUDIT.md](../../../../AI_FAILURE_AUDIT.md) nếu thấy lỗi thật.

### 1. Lighthouse trong DevTools

1. F12, tab **Lighthouse**, chọn Mode Navigation, Device Mobile, bật Performance, Accessibility, Best practices.
2. Bấm **Analyze page load**.
3. Chụp màn hình kết quả: `lighthouse-devtools.png`. Bấm ⋮ ở góc trên bên phải panel, chọn **Save as JSON**, lưu `lighthouse-devtools.report.json`.

### 2. Đồng hồ không trôi khi tab nền (cổng 1 của WBS)

1. Tải lại trang, nhìn crate **G-Coin Contraband Crate** (đếm ngược 10 phút). Ghi lại số đang hiển thị và giờ đồng hồ máy.
2. Chuyển sang tab khác và để **2 phút** (tab khác phải là tab đang xem, không phải cửa sổ mới che).
3. Quay lại tab app và chụp ngay trong 1 giây: `drift-wake.png`. Số hiển thị phải đúng (bằng số ban đầu trừ khoảng 120 giây), không chậm hàng phút.
4. Tuỳ chọn, để thấy lỗi nếu làm sai: DevTools > Console, dán `performance.now()` lúc rời và lúc quay lại để chứng minh đã thật sự qua ~120 giây. Chụp: `drift-console.png`.

### 3. Accessibility tree

1. F12 > tab **Elements** > panel con **Accessibility** (bật "Enable full-page accessibility tree" nếu cần).
2. Chọn một `article` của crate. Chụp cây có: `article "PVS Grand Finals VIP Ticket"`, `term`/`definition` (dl), `status` (countdown `output`, live off), `button "Claim"` (disabled kèm mô tả), và `alert` khi có 409: `a11y-tree-crate.png`.
3. Chọn bảng xếp hạng. Chụp: `table`, `columnheader` có `aria-sort: descending`, `rowheader` từng đội: `a11y-tree-leaderboard.png`.

### 4. 409 rollback

1. Chờ crate đầu hết đếm ngược (khoảng 20 giây), bấm **Claim** nhiều lần đến khi hiện khung đỏ.
2. Chụp trạng thái có khung `role="alert"` và số "Còn lại": `409-rollback-devtools.png`. (Đã có ảnh tự động [409-rollback.png](409-rollback.png).)

### 5. Bấm đúp chỉ một request

Vì API giả không đi qua mạng nên tab Network không thấy request. Cách chứng minh: DevTools > Console, dán đoạn sau khi crate đang mở, rồi xem kho chỉ giảm 1 (trước khi server trả lời):

```js
const b = [...document.querySelectorAll('article')][0].querySelector('button');
b.click(); b.click();
```

Chụp kho giảm đúng 1 và nút Claim chuyển disabled "Đang giữ chỗ...": `double-click.png`.

### 6. Bàn phím, Console, 375px

| Mục | Cách làm | Ảnh |
|---|---|---|
| Tab qua trang (2.1.1, 2.4.7) | Bấm Tab từ đầu trang: Claim (khi bật), ô lọc, ô sắp xếp; mỗi chỗ có khung focus đậm | `tab-focus.png` |
| Console sạch | Mở Console, tải lại, bấm Claim vài lần: không có lỗi hay cảnh báo | `console.png` |
| 375px | DevTools > Device toolbar > 375 x 812: không có thanh cuộn ngang (đã có [375px.png](375px.png) từ script) | `375px-devtools.png` |
| Giảm chuyển động | DevTools > Rendering > Emulate `prefers-reduced-motion: reduce`: nút không còn hiệu ứng lún | `reduced-motion.png` |

## Phải kiểm lại

Nếu đổi giao diện hoặc thêm thành phần mới thì chạy lại `check-layout.mjs`, `check-contrast.mjs` và Lighthouse.
