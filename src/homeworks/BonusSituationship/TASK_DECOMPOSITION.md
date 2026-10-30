# TASK_DECOMPOSITION — Bonus: Situationship Analyzer (tuỳ chọn)

> WBS con của [TASK_DECOMPOSITION.md](../../../TASK_DECOMPOSITION.md). Không nằm trong lịch 180 phút và thang điểm; chỉ làm sau khi xong mọi bài chấm điểm. Mỗi prompt AI = đúng một task ID.

## 1. Mục tiêu và phạm vi

`<SituationshipAnalyzer />` lấy cảm hứng từ bài "Hẹn Hò Nhưng Không Yêu": thay bộ boolean mâu thuẫn bằng máy trạng thái hữu hạn, tính điểm bất đối xứng bằng state dẫn xuất, timer "seen không rep" 5 giây có cleanup.

**Ràng buộc cứng:** FSM thay cho `isDating`/`isLoved`; nhật ký tín hiệu bất biến (`[...prev, signal]`); điểm và cờ đỏ tính trong render; cảnh báo trong `<output role="status" aria-live="polite">`; input có `useId` + label; 375px.
**Ngoài phạm vi:** AI chat thật, lưu trữ.

## 2. Contract

Slide có hai bộ tên trạng thái mâu thuẫn ([Context.md §9](../../../docs/Context.md)); **chốt một bộ** ở task B-01 (đề xuất bộ trong code mẫu):

```js
/** @typedef {'FRIENDS'|'DATING_NO_LOVE'|'OFFICIAL_LOVE'|'GHOSTED_EXIT'} RelationshipPhase */
/** @typedef {{ id:string, actor:'EM'|'AI_DO', steps:number, multiplier:number }} EffortSignal */
// impact = steps * multiplier   (vd EM: 100 * 0.1 = 10;  AI_DO: 1 * 50 = 50)
// isRedFlag = phase === 'DATING_NO_LOVE' && emImpact < rivalImpact
```

- Bảng chuyển trạng thái (hàm thuần `transition(phase, event)`) đặt một chỗ; `GHOSTED_EXIT` là trạng thái cuối (unmount, giải phóng timer).
- Timer ghosting: effect phụ thuộc `[phase, myTries]`; cleanup `clearTimeout`; nút "Dừng Lại" cũng dọn timer.

## 3. Task

| ID | Task | File | Gate | Trạng thái |
|---|---|---|---|---|
| B-01 | Chốt bộ trạng thái + `transition()` thuần | `fsm.js` | Test: mọi chuyển hợp lệ/không hợp lệ | [ ] |
| B-02 | Reducer nhật ký tín hiệu bất biến + điểm dẫn xuất | `effort.js` | Test: không mutate; điểm đúng | [ ] |
| B-03 | Component + `<output role="status">` cờ đỏ | `SituationshipAnalyzer.jsx` | Test: red flag khi `em < rival` | [ ] |
| B-04 | Ghosting timer 5s + cleanup + abort promise | `SituationshipAnalyzer.jsx` | Test (fake timers): unmount không còn timer | [ ] |
| B-05 | Form tín hiệu `useId` + label; CSS Modules 375px | `*.module.css` | Lighthouse a11y 100 | [ ] |

## 4. Commit (từ đề)

`feat(fsm): model HenHoKhongYeu state machine` (B-01, B-02) · `feat(ui): add derived red-flag meter & ghosting cleanup` (B-03 đến B-05)
