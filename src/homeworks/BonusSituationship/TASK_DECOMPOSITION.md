# TASK_DECOMPOSITION — Bonus: Situationship Analyzer (tuỳ chọn)

> WBS con của [TASK_DECOMPOSITION.md](../../../TASK_DECOMPOSITION.md). Không nằm trong lịch 180 phút và thang điểm; chỉ làm sau khi xong mọi bài chấm điểm. Mỗi prompt AI = đúng một task ID.
> **Mỗi bài là một project Vite độc lập** (có `package.json`, `node_modules/` riêng). Chạy mọi lệnh `npm` ngay trong folder này; đường dẫn file bên dưới tính từ folder này.

## 1. Mục tiêu và phạm vi

`<SituationshipAnalyzer />` lấy cảm hứng từ bài "Hẹn Hò Nhưng Không Yêu": thay bộ boolean mâu thuẫn bằng máy trạng thái hữu hạn, tính điểm bất đối xứng bằng state dẫn xuất, timer "seen không rep" 5 giây có cleanup.

**Ràng buộc cứng:** FSM thay cho `isDating`/`isLoved`; nhật ký tín hiệu bất biến (`[...prev, signal]`); điểm và cờ đỏ tính trong render; cảnh báo trong `<output role="status" aria-live="polite">`; input có `useId` + label; 375px.

**Ngoài phạm vi:** AI chat thật, lưu trữ, âm thanh/nhạc nền (bản quyền, không cần cho bonus), request mạng.

## 2. Quyết định đã chốt

| Vấn đề | Quyết định | Lý do |
|---|---|---|
| Hai bộ tên trạng thái trong slide | `FRIENDS`, `DATING_NO_LOVE`, `OFFICIAL_LOVE`, `GHOSTED_EXIT` | Bộ trong code mẫu; Context.md §9 yêu cầu chọn một bộ và nhất quán |
| Multiplier | Hằng số theo actor: `EM` = 0.1, `AI_DO` = 50 | Form chỉ nhập `steps`, giảm bề mặt lỗi |
| Timeout timer | Hết 5 giây không có `AI_DO` trả lời thì gửi `GHOST` | Giữ đúng ý "seen không rep"; Reset để chơi lại |
| "Abort promise" trong đề | Bỏ; chỉ `clearTimeout` | Bài không có promise/request nào để abort |
| State | Một `useReducer` giữ `{ phase, log }` | Một chỗ duy nhất đổi state, dễ nâng/thêm field khi bị sửa tại chỗ |
| Dependency của effect | `[phase, log]` | Reset timer khi `AI_DO` phản hồi, không chỉ khi `EM` nhắn |

## 3. Contract

```js
/** @typedef {'FRIENDS'|'DATING_NO_LOVE'|'OFFICIAL_LOVE'|'GHOSTED_EXIT'} RelationshipPhase */
/** @typedef {'ASK_OUT'|'COMMIT'|'GHOST'} RelationshipEvent */
/** @typedef {{ id:string, actor:'EM'|'AI_DO', steps:number, multiplier:number }} EffortSignal */
/** @typedef {{ phase: RelationshipPhase, log: readonly EffortSignal[] }} AnalyzerState */

// impact(signal) = steps * multiplier   (vd EM: 100 * 0.1 = 10;  AI_DO: 1 * 50 = 50)
// emImpact / rivalImpact = tổng impact của log theo actor
// isRedFlag = phase === 'DATING_NO_LOVE' && emImpact < rivalImpact
```

**Bảng chuyển** (`transition(phase, event)`, hàm thuần, đặt một chỗ trong `src/fsm.js`):

| Từ pha | Sự kiện | Sang pha |
|---|---|---|
| `FRIENDS` | `ASK_OUT` | `DATING_NO_LOVE` |
| `DATING_NO_LOVE` | `COMMIT` | `OFFICIAL_LOVE` |
| `DATING_NO_LOVE` | `GHOST` | `GHOSTED_EXIT` |
| `OFFICIAL_LOVE` | `GHOST` | `GHOSTED_EXIT` |
| `GHOSTED_EXIT` | mọi sự kiện | `GHOSTED_EXIT` (trạng thái cuối) |
| Cặp khác | | giữ nguyên pha cũ |

**Invariant:**
- Không có cặp boolean nào mô tả quan hệ; chỉ `phase`.
- `log` không bao giờ bị mutate; thêm tín hiệu bằng `[...log, signal]`.
- `emImpact`, `rivalImpact`, `isRedFlag` không nằm trong state, tính lại mỗi render.
- Mọi `setTimeout` có `clearTimeout` trong cleanup; unmount không để lại timer.
- `id` của tín hiệu duy nhất (counter trong reducer hoặc `crypto.randomUUID()`), dùng làm `key`.

## 4. Task

| ID | Task | File | Gate | Trạng thái |
|---|---|---|---|---|
| B-00 | Khởi tạo project Vite riêng: sao chép `package.json` (đổi `name`), `vite.config.js`, `eslint.config.js`, `index.html`, `src/main.jsx`, `src/test/setup.js` từ Ex1, rồi `npm install` | `package.json`, `vite.config.js`, `eslint.config.js`, `index.html`, `src/main.jsx`, `src/test/setup.js` | `npm test` và `npm run lint` chạy được | [ ] |
| B-01 | Chốt bộ trạng thái + `transition()` thuần | `src/fsm.js`, `src/fsm.test.js` | Test: mọi chuyển hợp lệ; cặp không hợp lệ giữ pha; `GHOSTED_EXIT` bất động với mọi sự kiện | [ ] |
| B-02 | Reducer nhật ký tín hiệu bất biến + điểm dẫn xuất | `src/effort.js`, `src/effort.test.js` | Test: không mutate (`Object.freeze` mảng gốc); `100 × 0.1` vs `1 × 50`; `isRedFlag` đúng theo pha | [ ] |
| B-03 | Component + `<output role="status">` cờ đỏ | `src/SituationshipAnalyzer.jsx`, `src/SituationshipAnalyzer.test.jsx` | Test: red flag khi `em < rival` ở `DATING_NO_LOVE`; không có cờ ở pha khác; `role="status"` có nội dung đúng | [ ] |
| B-04 | Ghosting timer 5s + cleanup | `src/SituationshipAnalyzer.jsx` | Test (fake timers): hết 5s sang `GHOSTED_EXIT`; `AI_DO` trả lời hoặc Dừng Lại thì hủy; unmount không còn timer (`vi.getTimerCount() === 0`) | [ ] |
| B-05 | Form tín hiệu `useId` + label; CSS Modules 375px | `src/SituationshipAnalyzer.module.css`, `src/App.jsx` | Lighthouse a11y 100; 375px không cuộn ngang; `valueAsNumber` + `Number.isNaN` có test | [ ] |

### Chi tiết từng task

**B-00 — Khởi tạo project**
- Sao chép cấu hình từ `src/exercises/Exercise1_DeveloperCard`, đổi `name` trong `package.json` thành `bonus-situationship`. Không sao chép `node_modules/`, `dist/`.
- `src/main.jsx`: `createRoot` + `<StrictMode>`, render `<App />`.
- Verify: `npm install`, `npm test` (chưa có test thì cho phép `--passWithNoTests` hoặc một test smoke), `npm run lint`.

**B-01 — FSM**
- `PHASES` và `EVENTS` là hằng số đóng băng; bảng chuyển là object tra cứu, không `switch` lồng.
- `transition(phase, event)` trả pha mới; không throw với cặp không hợp lệ.
- Test dạng bảng: duyệt mọi (pha × sự kiện), khẳng định kết quả khớp bảng ở mục 3.

**B-02 — Effort**
- `MULTIPLIER = { EM: 0.1, AI_DO: 50 }`; `createSignal(actor, steps, id)` trả `EffortSignal`.
- `effortReducer(log, action)` xử lý `ADD` (`[...log, signal]`) và `CLEAR` (`[]`); `impactOf(log, actor)` dùng `reduce`; `isRedFlag(phase, emImpact, rivalImpact)`.
- Test: mảng gốc bị `Object.freeze` mà reducer vẫn chạy; tổng EM 100 bước = 10, AI_DO 1 bước = 50.

**B-03 — Component**
- `useReducer` giữ `{ phase, log }`, gộp `transition` và `effortReducer`. Nút theo pha: "Rủ đi chơi" (`ASK_OUT`), "Official" (`COMMIT`), "Dừng Lại" (`GHOST`), "Reset".
- Danh sách log dùng `key={signal.id}`. Không dùng `<div>` thừa khi có thẻ ngữ nghĩa (`<main>`, `<section>`, `<ul>`, `<dl>` cho điểm).
- `<output role="status" aria-live="polite">` hiển thị cảnh báo; khi không có cờ thì vẫn render phần tử rỗng/nhẹ để vùng live ổn định.

**B-04 — Timer**
- Một `useEffect` phụ thuộc `[phase, log]`: nếu `phase === 'DATING_NO_LOVE'` và tín hiệu cuối cùng là `EM` thì `setTimeout(() => dispatch(GHOST), 5000)`; cleanup `clearTimeout`.
- Test với `vi.useFakeTimers()`: advance 4999ms chưa ghost, 5000ms thì ghost; thêm tín hiệu `AI_DO` giữa chừng thì không ghost; unmount rồi `vi.getTimerCount()` bằng 0. Test rõ ràng chạy dưới `<StrictMode>` (effect chạy hai lần ở dev, không được nhân đôi timer).

**B-05 — Form, CSS, a11y**
- `useId()` cho `<select>` actor và `<input type="number">` steps, mỗi cái có `<label htmlFor>`. Đọc số bằng `e.target.valueAsNumber`, chặn `Number.isNaN` và số `< 1`.
- CSS Modules + Custom Properties, không inline `style`. Kiểm tra 375px bằng DevTools device mode.
- Verify: Lighthouse accessibility, Accessibility tree (landmark, tên label, `status`), tab bàn phím qua mọi nút. Lưu bằng chứng ở `evidence/`.

## 5. Lệnh kiểm tra lặp lại

Chạy trong folder này:

```bash
npm test
npm run lint
grep -rn "http://" src
grep -rnE "isDating|isLoved|hasTitle" src
```

Hai lệnh `grep` phải ra 0 dòng (ngoài chú thích mô tả lỗi).

## 6. Commit

Message chốt từ đề, dùng đúng nguyên văn:

| Commit | Task | Message |
|---|---|---|
| 1 | B-00 | `chore(bonus): init vite project for situationship analyzer` |
| 2 | B-01, B-02 | `feat(fsm): model HenHoKhongYeu state machine` |
| 3 | B-03 đến B-05 | `feat(ui): add derived red-flag meter & ghosting cleanup` |

Nếu B-03, B-04, B-05 diff lớn thì tách thành nhiều commit `feat(ui): ...`, giữ message đầu tiên của đề cho commit đầu của cụm.
