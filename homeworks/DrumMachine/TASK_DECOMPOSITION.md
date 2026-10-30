# TASK_DECOMPOSITION — Homework 1: Production Studio Drum Kit

> WBS con của [TASK_DECOMPOSITION.md](../../TASK_DECOMPOSITION.md). Mỗi prompt AI = đúng một task ID. Nối tiếp HW1 Lab 2 (WCAG 2.2 AA, Lighthouse 100) và Drum Kit HW2 của Lab 1 (`C:\Dev\Project\MSIS207_Lab1\Homework_2`, dùng làm tham khảo âm thanh).

## 1. Mục tiêu và phạm vi

Chuyển Drum Kit phím `w/a/s/d/j/k/l` của deck cũ thành app React 19 đạt WCAG 2.2 AA và Lighthouse a11y 100.

**Ràng buộc cứng:**
- Nghe `window` `keydown`/`keyup` bằng `e.code` (`KeyW`, `KeyA`, `KeyS`, `KeyD`, `KeyJ`, `KeyK`, `KeyL`) để UniKey không phá phím tắt.
- `if (e.repeat) return;`; bỏ qua khi `target` là `INPUT/TEXTAREA/SELECT`.
- Pad là `<button aria-pressed={isActive}>`; hit log `<output aria-live="polite">`; thanh decibel trực quan cho người khiếm thính.
- Cleanup listener và âm thanh khi unmount.
**Ngoài phạm vi:** ghi/phát lại (đã có ở Lab 1), lưu trữ, nhạc cụ khác.

## 2. Contract

```js
/** @typedef {{ id: string, code: string, label: string, sound: string }} Pad */   // code: 'KeyW'
// padMap: Map<string /*e.code*/, Pad>   -- một nguồn duy nhất cho phím <-> pad <-> âm
/**
 * useDrumKeyboard(padMap, onTriggerPad, isEnabled = true) -> void
 *   - đăng ký keydown, cleanup removeEventListener
 * useDrumAudio() -> { trigger(padId): void, level: number }
 */
```

- Bảng phím, tên âm, ngưỡng đặt ở **một module** (`drumPads.js`) để sửa phím chỉ một dòng khi bị đột biến.
- Âm thanh: dùng file `.wav` hoặc tổng hợp bằng Web Audio; phát chồng được (polyphonic); `play().catch(...)` hoặc xử lý `AudioContext.resume()` sau thao tác người dùng.
- Pad kích hoạt bằng cả chuột/chạm và bàn phím; vùng bấm >= 24×24 CSS px (WCAG 2.5.8).

## 3. Task

| ID | Task | File | Gate | Trạng thái |
|---|---|---|---|---|
| H1-01 | Spec + `drumPads.js` (mảng pad, `padMap`) | `src/drumPads.js` | Test: 7 pad, `e.code` duy nhất | [ ] |
| H1-02 | `useDrumKeyboard`: `e.code`, `e.repeat`, bỏ qua input, cleanup | `src/useDrumKeyboard.js` | Test: giữ phím không bắn lặp; gõ trong input không kích hoạt; unmount gỡ listener | [ ] |
| H1-03 | Audio engine/hook phát chồng, không pop | `src/useDrumAudio.js` | Test: nhấn nhanh nhiều lần vẫn phát; không lỗi Console | [ ] |
| H1-04 | `<Pad>` là `<button type="button" aria-pressed>` | `src/Pad.jsx` | Accessibility tree: nút có tên và trạng thái pressed | [ ] |
| H1-05 | `<DrumMachine>` ghép pad, keyboard, audio; trạng thái active có thời hạn (timer có cleanup) | `src/DrumMachine.jsx` | Test: phím W làm pad W `aria-pressed=true` rồi về false | [ ] |
| H1-06 | Hit log `<output aria-live="polite">` (giới hạn độ dài, không spam đọc) | `src/HitLog.jsx` | Screen reader/ảnh a11y tree; test nội dung log | [ ] |
| H1-07 | Decibel meter trực quan (không chỉ màu; có text/aria) | `src/LevelMeter.jsx` | Có nhãn chữ; tương phản >= 3:1 | [ ] |
| H1-08 | CSS Modules: focus-visible, tương phản 4.5:1, vùng bấm, 375px, reduced-motion | `*.module.css` | Tab hết trang; 0 cuộn ngang ở 375px | [ ] |
| H1-09 | Kiểm tự động + tay: Lighthouse a11y 100, tab bàn phím, UniKey | `evidence/` | JSON Lighthouse, ảnh a11y tree, ghi chú thử UniKey | [ ] |

## 4. Commit gợi ý

`docs(hw1): add drum kit spec` · `feat(hw1): pad map and drum keyboard hook` · `feat(hw1): audio trigger with aria-pressed pads` · `feat(hw1): hit log and decibel meter` · `style(hw1): wcag 2.2 aa focus, contrast and 375px` · `test(hw1): lighthouse and keyboard evidence`

## 5. Cổng kiểm tra

```bash
grep -rnE 'keyCode|keypress|alert\(' homeworks/DrumMachine     # 0 dòng
npm test -- homeworks/DrumMachine
```

DevTools: Lighthouse Accessibility = 100; chỉ dùng bàn phím vẫn chơi được; giữ phím không flood; gõ vào ô nhập (nếu có) không kích hoạt pad.

## 6. Dễ sai

- Dùng `e.key` thay `e.code`; quên `e.repeat`; `window.addEventListener` thiếu cleanup (nhân đôi listener dưới StrictMode).
- Tạo `Audio` mới mỗi lần nhấn gây rò; `aria-pressed` không đồng bộ; hit log đọc từng phím gây ồn.
