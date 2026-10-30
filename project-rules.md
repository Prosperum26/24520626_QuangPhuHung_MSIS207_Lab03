# Project Rules — Lab 03 (React 19)

> Nạp file này cho mọi AI assistant dùng trong repo (tương đương `.cursorrules` ở slide 8). Nếu yêu cầu mâu thuẫn với file này, dừng lại và chỉ ra mâu thuẫn thay vì âm thầm phá luật.
> Nguồn: **[Thầy]** = từ slide Lab 3, **[Lab 1/2]** = kế thừa từ lab trước, **[Cá nhân]** = mình đặt thêm.
> Bối cảnh: [docs/Context.md](docs/Context.md). Quy tắc riêng cho AI: [Agents.md](Agents.md).

## 1. Stack [Thầy]

- React 19 + Vite + ES2024 (nối tiếp Lab 2). `createRoot` từ `react-dom/client`, bọc `<StrictMode>`.
- JS (`.jsx`) với contract bằng JSDoc, hoặc TypeScript nếu chọn; quyết định một lần ở task `X0` rồi giữ nguyên.
- CSS Modules (`*.module.css`) + CSS Custom Properties. Không Tailwind, không UI framework, không Ant Design.
- Test: Vitest + jsdom + React Testing Library [Cá nhân, giả định].
- Không dùng state manager ngoài (Zustand, Redux), router, RSC: thuộc Lab 4-6.

## 2. Quy trình 4 giai đoạn [Thầy + Lab 2]

1. **Vertical Slice** — chia việc trong `TASK_DECOMPOSITION.md`.
2. **Props & State Contract** — viết trước khi prompt AI.
3. **Atomic AI Generation** — một prompt = một task ID = một component/hook/module.
4. **Verification + Commit** — React DevTools Profiler, Accessibility tree, Lighthouse, 375px, rồi mới commit.

**One-shot prompting bị cấm**: dán cả đề Exercise/Homework vào AI làm một lần cho 0% ở mục Git & Audit (15%).

## 3. API bị cấm [Thầy]

| Cấm | Thay bằng |
|---|---|
| `ReactDOM.render()` | `createRoot(el).render(...)` |
| `class X extends React.Component` | Function component + hooks |
| `Component.defaultProps` | Default parameter khi destructure: `({ label = 'Deploy' })` |
| `import * as React from 'react'` | `import { useState, useEffect } from 'react'` |
| `antd/dist/antd.css`, URL `http://` | CSS Modules; chỉ `https://` |
| `setTimeout` trong `constructor` | `useEffect` + cleanup |
| `push`/`splice`/`sort` trên state | `[...prev, x]`, `filter`, `toSorted` |
| `key={i}`, key là text trùng được | Key là ID thực thể ổn định (`m.id`) |
| Ba `<h1>` cho dữ liệu key-value | `<dl>/<dt>/<dd>` |
| `window.alert()`, `keyCode`, `keypress` | `<section role="alert">`, `e.code`, `keydown` |
| `dangerouslySetInnerHTML`, `innerHTML` | JSX tự escape chuỗi |
| `<button>` không `type` | `type="button"` (hoặc `submit` có chủ đích) |

## 4. Quy tắc theo chủ đề

### 4.1 HTML ngữ nghĩa, zero div-soup [Thầy]

- Landmark: một `<main>` ở cấp cao nhất, bên trong `<section>`/`<article>`/`<header>`. Không đặt `<main>` trong `<section>`.
- Dùng `<Fragment>` (`<>...</>`) thay cho div bọc. Fragment trong `.map()` phải có `key`: `<Fragment key={k}>`.
- `DeveloperCard.jsx` có **0 thẻ `<div>`** (kiểm bằng `grep`). Các phần khác cũng ưu tiên thẻ ngữ nghĩa; dùng `<div>` chỉ khi không có thẻ nào đúng nghĩa và phải ghi lý do trong code review.
- Mỗi trang đúng một `<h1>`, heading không nhảy cấp.
- Thông báo trạng thái dùng `<output role="status" aria-live="polite">`; lỗi chặn dùng `<section role="alert">`.

### 4.2 Component thuần [Thầy]

- `UI = f(props, state)`. Component không sửa props, không có side effect trong thân render.
- Composition qua `children`. Mỗi component có contract props (JSDoc/TS) ghi rõ kiểu và default.
- Sự kiện: truyền handler qua props (`onAction`); không `this`, không `bind`.

### 4.3 State hygiene [Thầy]

- Chỉ giữ **dữ liệu độc lập** trong `useState` (`people`, `query`, `minIq`, `sortBy`). Dữ liệu dẫn xuất tính ngay trong thân render:
  `const visible = people.filter(...).toSorted(...)`.
- **Cấm** `useEffect` + `setState` để đồng bộ filter/sort (gây render đôi).
- Cập nhật bất biến; hàm cập nhật dạng `setX((prev) => ...)` khi phụ thuộc state trước.
- Danh sách có `id` ổn định (`crypto.randomUUID()` hoặc id cấp trong dữ liệu), không dùng index.

### 4.4 Form truy cập được [Thầy]

- Mỗi `<input>`/`<select>` đi với `<label htmlFor={id}>`, `id` từ `useId()` (gọi ở top level component).
- Input số: đọc `e.target.valueAsNumber`, nếu `Number.isNaN` thì dùng giá trị dự phòng. `e.target.value` luôn là chuỗi.
- `<form role="search" onSubmit={(e) => e.preventDefault()}>` cho form lọc.

### 4.5 Effect và bất đồng bộ [Thầy]

- Mọi timer, listener, subscription, fetch trong `useEffect` **phải** có cleanup trả về.
- Fetch: `new AbortController()` trong effect, truyền `{ signal }`, `controller.abort()` trong cleanup, và `if (err.name === 'AbortError') return;` để không hiện lỗi giả.
- Khai báo đủ dependency; không tắt rule exhaustive-deps. Tránh stale closure với `setInterval` bằng dependency đúng hoặc functional update.
- Trạng thái tải dùng máy trạng thái hữu hạn: `status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'` (nối tiếp `ViewState<T>` của Lab 2), không dùng bộ boolean `isLoading && isError`.
- `LOADING` hiển thị skeleton cùng kích thước nội dung thật, `aria-busy="true"`, CLS = 0.
- StrictMode chạy effect hai lần ở dev: cleanup phải làm effect idempotent.

### 4.6 Thời gian và âm thanh [Thầy]

- Đồng hồ đếm ngược không được trừ dần mỗi tick. Luôn tính từ mốc tuyệt đối: `Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs))`, và tính lại ngay khi `visibilitychange` sang `visible`.
- Âm thanh: tạo `AudioContext` sau thao tác của người dùng; ngắt envelope bằng `exponentialRampToValueAtTime` trước `osc.stop()`; disconnect node khi unmount.
- Bàn phím: `e.code` (không phụ thuộc IME UniKey), `if (e.repeat) return;`, bỏ qua khi `target` là `INPUT/TEXTAREA/SELECT`.

### 4.7 Hiệu năng [Thầy]

- Đo trước khi tối ưu bằng React DevTools Profiler. `React.memo`, `useCallback` chỉ khi có số liệu (bắt buộc ở HW2: nhấn một phím chỉ render lại đúng phím đó).
- Không tạo object/array/hàm literal mới mỗi render làm vô hiệu `memo`.

### 4.8 CSS và responsive [Thầy + Lab 1]

- CSS Modules, màu và khoảng cách là custom property khai báo một lần ở `:root`. Không hardcode hex ngoài token.
- Ảnh có `width`, `height`, `alt` (zero CLS); ảnh đại diện có fallback chữ cái đầu.
- 375px (iPhone SE) không cuộn ngang; thử đến 1440px.
- `:focus-visible` rõ ràng; `@media (prefers-reduced-motion: reduce)` tắt shimmer/animation.

### 4.9 Bảo mật [Thầy + Lab 1/2]

- Chỉ HTTPS cho tài nguyên ngoài. Không `dangerouslySetInnerHTML`. Không nhét dữ liệu người dùng vào URL/HTML thô.
- Dữ liệu mô phỏng (mock API, 409, packet loss) nằm ở module riêng, có seed hoặc tham số để test tất định.

## 5. Khả năng truy cập: WCAG 2.2 mức AA [Cá nhân, kế thừa Lab 2]

Áp dụng cho **mọi UI** và **mọi tài liệu**. Mục tiêu điểm: 100 Lighthouse Accessibility.

### 5.1 Với UI

| Tiêu chí | Quy tắc |
|---|---|
| 1.3.1 Info and Relationships | Thẻ ngữ nghĩa, `<dl>` cho cặp khóa-giá trị, `<ul>` cho danh sách, `aria-labelledby` cho `article` |
| 1.4.1 Use of Color | Không truyền thông tin chỉ bằng màu (trạng thái luôn có chữ) |
| 1.4.3 / 1.4.11 Contrast | Chữ thường 4.5:1, chữ lớn và viền control 3:1, cả hai theme |
| 2.1.1 Keyboard | Mọi chức năng dùng được bằng bàn phím; control là `<button>`, `<a>`, `<input>` |
| 2.4.7 / 2.4.11 Focus | Luôn thấy focus; focus không bị che hoàn toàn |
| 2.5.8 Target Size | Vùng bấm tối thiểu 24×24 CSS px (phím piano, pad trống, nút) |
| 3.3.2 Labels | Mỗi control có nhãn hiển thị |
| 4.1.2 Name, Role, Value | Control có tên truy cập; toggle dùng `aria-pressed` |
| 4.1.3 Status Messages | `role="status"`/`aria-live="polite"` cho đếm kết quả, hit log; `role="alert"` cho lỗi |

Ưu tiên HTML gốc, ARIA là phương án cuối. Kiểm bằng Accessibility tree, tab bàn phím và Lighthouse; công cụ tự động không bắt hết lỗi.

### 5.2 Với tài liệu Markdown

- Mỗi file đúng một H1, heading phân cấp liên tục.
- Link có văn bản mô tả; bảng có hàng tiêu đề; code block ghi ngôn ngữ; ảnh có alt cụ thể.
- Không dùng emoji hay màu làm nghĩa duy nhất; trạng thái luôn có chữ ("Cấm", "Đã sửa").

## 6. Git [Thầy + Lab 1/2]

- Conventional Commits: `type(scope): message`; types `feat`, `fix`, `style`, `refactor`, `test`, `docs`, `chore`, `perf`.
- Message chốt sẵn theo đề dùng đúng nguyên văn (xem [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md)).
- Spec trước code: commit tài liệu WBS đi trước commit code của bài đó.
- Ít nhất **6-8 commit atomic** khớp WBS, `git log --oneline --graph` đọc được ngay.
- **AI không commit, không push.** AI đề xuất chia commit; người dùng xem diff và tự commit.
- Không `--force`, không `--no-verify`. Không commit PDF đề, `node_modules/`, `dist/`.

## 7. Bảo vệ trực tiếp (25%) [Thầy]

- 60-180 giây, **tắt hết AI** (ChatGPT, Claude, Cursor, Copilot). Quy trình: kiểm `git log` và WBS (30s) → kiểm DevTools và 375px (30s) → đột biến kiến trúc (60-180s).
- Thiết kế để đổi một yêu cầu bằng sửa nhỏ: hằng số, cấu hình, mapping phím, chu kỳ polling nằm **một chỗ**; state có thể nâng lên `<App />` mà không viết lại component.
- Không giữ đoạn mã mình không giải thích được.

## 8. Định nghĩa "Xong" cho mỗi sub-task

- [ ] Khớp contract props/state trong WBS của bài.
- [ ] Test của task pass (dán output thật).
- [ ] Console sạch: không warning (kể cả key warning, StrictMode), không error.
- [ ] Grep sạch: không `<div` (Ex1), không `http://`, không `class extends`, `ReactDOM.render`, `defaultProps`, `keyCode`, `alert(`, `dangerouslySetInnerHTML`, `key={i`.
- [ ] 375px không cuộn ngang; thao tác được bằng bàn phím.
- [ ] Profiler/Network/Accessibility tree kiểm xong nếu task liên quan; bằng chứng lưu ở `evidence/`.
- [ ] Prompt log đã lưu ở `docs/prompt_logs/`; lỗi AI gặp được ghi vào ghi chú cho `AI_FAILURE_AUDIT.md`.
- [ ] Commit atomic đúng message đã định.

## 9. Quy tắc cá nhân [Cá nhân]

<!-- Bổ sung quy tắc riêng ở đây, rồi nhờ AI viết lại cho gọn. -->

- _(chưa có)_
