# TASK_DECOMPOSITION — Exercise 3: PubgMatchTelemetry (Sprint 3, 35 phút)

> WBS con của [TASK_DECOMPOSITION.md](../../../TASK_DECOMPOSITION.md). Mỗi prompt AI = đúng một task ID.
> **Mỗi bài là một project Vite độc lập** (có `package.json`, `node_modules/` riêng). Chạy mọi lệnh `npm` ngay trong folder này; đường dẫn file bên dưới tính từ folder này.

## 1. Mục tiêu và phạm vi

Radar trực tiếp cho các đội PUBG Vietnam Series: máy trạng thái `IDLE | LOADING | SUCCESS | ERROR`, skeleton 220px khi tải, mô phỏng mất gói 35%, đổi squad liên tục thì hủy request cũ bằng `AbortController`, lỗi hiển thị `<section role="alert">` với nút "Reconnect Satellite (Retry)".

**Ràng buộc cứng:** không `window.alert()`; mọi effect có cleanup; bỏ qua `AbortError`; skeleton cùng kích thước nội dung thật (CLS 0,00).
**Ngoài phạm vi:** auto-polling (là Challenge B, chuẩn bị chỗ nhưng chưa làm), WebSocket thật.

## 2. Contract

```js
/** @typedef {'IDLE'|'LOADING'|'SUCCESS'|'ERROR'} Status */
/** @typedef {{ id:string, name:string, map:string, phase:string, alive:number, kills:number, wwcdProb:string, status:string }} Squad */
/** @typedef {{ status: Status, data: Squad|null, error: string|null }} ViewState */
/**
 * @param {string} squadId
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<Squad>}   // reject Error('...') hoặc DOMException AbortError
 */
// fetchKraftonPubgTelemetry
```

- Dữ liệu: `ces` Cerberus Esports (Erangel, Phase 6, 4 sống, 14 kill, 68%), `te` The Expendables (Miramar, Phase 7, 4, 18, 82%), `ge` Genius Esports (Taego, Phase 5, 3, 9, 41%).
- Mock `fetchKraftonPubgTelemetry`: độ trễ tham số hóa (mặc định khoảng 800-1200ms), xác suất lỗi `lossRate = 0.35`, **tham số tiêm được** (rng/latency) để test tất định; lắng nghe `signal` và reject `AbortError` ngay khi abort; `signal` đã abort từ đầu thì reject ngay.
- Chỉ một tên hàm cho fetch (xem [Context.md §9](../../../docs/Context.md)).
- `squadId` mặc định `'te'`; bộ chọn squad là nhóm `<button aria-pressed>` hoặc `radio` có label.
- Hằng cấu hình (latency, lossRate, danh sách squad) ở **một module**, dễ đổi khi bị đột biến.

## 3. Task

| ID | Task | File | Gate | Trạng thái |
|---|---|---|---|---|
| E3-00 | Khởi tạo project Vite riêng: sao chép `package.json` (đổi `name`), `vite.config.js`, `eslint.config.js`, `index.html`, `src/main.jsx`, `src/test/setup.js` từ Ex1, rồi `npm install` | `package.json`, `vite.config.js`, `eslint.config.js`, `index.html`, `src/main.jsx`, `src/test/setup.js` | `npm test` và `npm run lint` chạy được | [ ] |
| E3-01 | Dữ liệu `PUBG_VN_SQUADS` + typedef | `src/data/pubgSquads.js` | Test: 3 squad đủ trường | [ ] |
| E3-02 | Mock `fetchKraftonPubgTelemetry` có latency, lossRate, tôn trọng `signal`, **dọn timer và listener khi abort** (§7) | `src/api/krafton.js` | Test: abort giữa chừng → `AbortError`; lossRate 1 → luôn lỗi; 0 → luôn thành công; sau abort `vi.getTimerCount() === 0` | [ ] |
| E3-03 | Component + `ViewState`, effect `LOADING → SUCCESS/ERROR` | `src/components/PubgMatchTelemetry.jsx` | Test: đủ 3 trạng thái hiển thị đúng | [ ] |
| E3-04 | Cleanup `controller.abort()` + guard `AbortError` | `src/components/PubgMatchTelemetry.jsx` | Test: đổi squad khi đang tải → không hiện lỗi giả, dữ liệu đúng squad mới | [ ] |
| E3-05 | Bộ chọn squad (CES, TE, GE); cache theo squad bằng `useRef(Map)` (§7) | `src/components/PubgMatchTelemetry.jsx` | Click nhanh CES→TE→GE: Network có `(canceled)`; quay lại squad cũ không nháy skeleton | [ ] |
| E3-06 | Hiển thị dữ liệu SUCCESS bằng `<article>` + `<dl>` (map, phase, alive, kills, WWCD, status) | `src/components/PubgMatchTelemetry.jsx` | Accessibility tree đúng; vùng cập nhật `aria-live="polite"` | [ ] |
| E3-07 | Skeleton 220px `aria-busy="true"` (tôn trọng reduced-motion) | `src/components/PubgMatchTelemetry.module.css` | Slow 3G: CLS 0,00 | [ ] |
| E3-08 | Lỗi `<section role="alert">` + nút Retry tăng `retryTick` | `src/components/PubgMatchTelemetry.jsx` | Test: retry chạy lại effect, về LOADING rồi kết quả mới | [ ] |
| E3-09 | CSS Modules + 375px | `src/components/PubgMatchTelemetry.module.css` | 0 cuộn ngang | [ ] |
| E3-10 | StrictMode: xác nhận không rò request/timer; lưu bằng chứng | `evidence/` | Ảnh Network (canceled), Performance CLS, Lighthouse a11y | [ ] |

## 4. Commit

| Commit | Message (nguyên văn đề) | Task |
|---|---|---|
| C7 | `feat(ex3): implement PUBG VN 4-state telemetry & AbortController` | E3-01 đến E3-06 |
| C8 | `feat(ex3): add skeleton UI & retry alert` | E3-07 đến E3-10 |

## 5. Cổng Checkpoint 3 (phút 155)

1. DevTools → Network → Slow 3G: skeleton hiện, CLS 0,00.
2. Click nhanh CES → TE → GE: các request trước hiển thị `(canceled)`, UI cuối cùng khớp GE.
3. Ép lỗi (lossRate 1): `<section role="alert">` xuất hiện, bấm Retry chạy lại; Console không có `alert()` hay cảnh báo.

## 6. Dễ sai

- Quên guard `AbortError` (nháy banner lỗi khi đổi squad); thiếu `controller.abort()` trong cleanup.
- Skeleton khác kích thước card (CLS); dùng `alert()`; bộ boolean `isLoading/isError`.
- Dependency thiếu `retryTick` hoặc `squadId` (stale closure).

## 7. Bộ nhớ, race và hiệu năng

- **Mock không rò**: `fetchKraftonPubgTelemetry` lưu id `setTimeout` và `clearTimeout` khi `signal` abort; đăng ký `signal.addEventListener('abort', onAbort, { once: true })` và gỡ khi settle. Test: sau abort không còn timer treo (fake timers, `vi.getTimerCount() === 0`).
- **Chống ghi đè muộn**: effect chỉ ghi state nếu `!controller.signal.aborted`, thêm một lớp bảo vệ ngoài việc bắt `AbortError`.
- **Cache theo squad**: giữ kết quả thành công gần nhất trong `useRef(new Map())`; khi quay lại squad đã có, hiển thị dữ liệu cũ thay vì skeleton nháy. Slide yêu cầu skeleton ở `LOADING`: lần tải đầu của mỗi squad vẫn hiện skeleton. Quyết định ở E3-05; nếu thấy lệch đề thì bỏ cache.
- **Render ít nhất**: tách `TelemetryView` (SUCCESS) và `TelemetrySkeleton` (LOADING) để đổi trạng thái không dựng lại phần chọn squad.
- **Polling (thử thách B)**: `POLL_MS = 5000` và `isPaused` ở một chỗ; effect riêng dependency `[squadId, isPaused]`; cleanup `clearInterval` và abort fetch đang bay; tab ẩn thì tạm dừng. Chỉ làm khi cần.
