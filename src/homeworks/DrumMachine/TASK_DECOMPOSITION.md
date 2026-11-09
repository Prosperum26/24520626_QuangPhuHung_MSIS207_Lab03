# TASK_DECOMPOSITION — Homework 1: Production Studio Drum Kit

> WBS con của [TASK_DECOMPOSITION.md](../../../TASK_DECOMPOSITION.md). Mỗi prompt AI = đúng một task ID. Nối tiếp HW1 Lab 2 (WCAG 2.2 AA, Lighthouse 100) và Drum Kit HW2 của Lab 1 (`C:\Dev\Project\MSIS207_Lab1\Homework_2`, dùng làm tham khảo âm thanh).
> **Mỗi bài là một project Vite độc lập** (có `package.json`, `node_modules/` riêng). Chạy mọi lệnh `npm` ngay trong folder này; đường dẫn file bên dưới tính từ folder này.

## 1. Mục tiêu và phạm vi

Chuyển Drum Kit phím `w/a/s/d/j/k/l` của deck cũ thành app React 19 đạt WCAG 2.2 AA và Lighthouse a11y 100.

**Ràng buộc cứng:**
- Nghe `window` `keydown`/`keyup` bằng `e.code` (`KeyW`, `KeyA`, `KeyS`, `KeyD`, `KeyJ`, `KeyK`, `KeyL`) để UniKey không phá phím tắt.
- `if (e.repeat) return;`; bỏ qua khi `target` là `INPUT/TEXTAREA/SELECT`.
- Pad là `<button aria-pressed={isActive}>`; hit log `<output aria-live="polite">`; thanh decibel trực quan cho người khiếm thính.
- Cleanup listener và âm thanh khi unmount.
**Ngoài phạm vi đề:** lưu trữ, nhạc cụ khác, quantize/metronome, reverb, phím tắt cho looper.

**Mở rộng tự chọn (H1-10 đến H1-15, cắt được mà không ảnh hưởng điểm):** 2 kit tổng hợp (Acoustic, Electronic 808), humanize, hi-hat choke, master volume/mute, meter đo âm thật, và looper (record, overdub, chế độ Loop/Once, tốc độ 0.5x-2x). Thiết kế đầy đủ: [spec](../../../docs/superpowers/specs/2026-11-09-hw1-drum-kit-design.md).

**Giả định đã chốt:** 7 pad (không phải 9 như Lab 1); "chờ" = chế độ Once; tốc độ chỉ co giãn nhịp, không đổi cao độ; looper chỉ điều khiển bằng nút; kit Acoustic copy 7 sample từ Lab 1, kit 808 sinh bằng script Node.

## 2. Contract

```js
/** @typedef {{ id: string, code: string, label: string, sound: string }} Pad */   // code: 'KeyW'
// padMap: Map<string /*e.code*/, Pad>   -- một nguồn duy nhất cho phím <-> pad <-> âm
/**
 * useDrumKeyboard(padMap, onTriggerPad, isEnabled = true) -> void
 *   - đăng ký keydown, cleanup removeEventListener
 * useDrumAudio() -> { trigger(padId, { when? }): void, now(): number, volume, setVolume, muted, setMuted,
 *                      kit, setKit, getLevelDb(): number }
 * (mở rộng H1-11; bản tối thiểu của WBS gốc chỉ cần trigger)
 */
/** @typedef {{ t: number, padId: string }} LoopEvent */   // t: giây trong vòng, 0 <= t < loopLen
// loopScheduler thuần: positionAt(anchor, nowAudio, speed, loopLen), eventsInWindow(events, loopLen, from, to), toAudioTime(anchor, loopT, speed)
```

Invariant looper: `anchor = { audioTime, loopT }`, đổi tốc độ thì đặt lại anchor (không nhảy vị trí); cửa sổ lập lịch liên tục `[lastTo, now + lookahead)` nên hit overdub không phát đúp; events bất biến (`[...prev, e]`).

Máy trạng thái looper: `empty -> recording -> playing <-> overdubbing`, `playing -> ready` (Stop hoặc hết vòng ở chế độ Once), `ready -> playing` (Play), Clear về `empty`. Hit không có hoặc `loopLen < MIN_LOOP_MS` thì Stop-recording về `empty`.

- Bảng phím, tên âm, ngưỡng đặt ở **một module** (`drumPads.js`) để sửa phím chỉ một dòng khi bị đột biến.
- Âm thanh: dùng file `.wav` hoặc tổng hợp bằng Web Audio; phát chồng được (polyphonic); `play().catch(...)` hoặc xử lý `AudioContext.resume()` sau thao tác người dùng.
- Pad kích hoạt bằng cả chuột/chạm và bàn phím; vùng bấm >= 24×24 CSS px (WCAG 2.5.8).

## 3. Task

| ID | Task | File | Gate | Trạng thái |
|---|---|---|---|---|
| H1-00 | Khởi tạo project Vite riêng: sao chép `package.json` (đổi `name`), `vite.config.js`, `eslint.config.js`, `index.html`, `src/main.jsx`, `src/test/setup.js` từ Ex1, rồi `npm install` | `package.json`, `vite.config.js`, `eslint.config.js`, `index.html`, `src/main.jsx`, `src/test/setup.js` | `npm test` và `npm run lint` chạy được | [x] |
| H1-01 | Spec + `src/drumPads.js` (mảng pad, `padMap`) | `src/drumPads.js` | Test: 7 pad, `e.code` duy nhất | [x] |
| H1-02 | `useDrumKeyboard`: `e.code`, `e.repeat`, bỏ qua input, cleanup | `src/useDrumKeyboard.js` | Test: giữ phím không bắn lặp; gõ trong input không kích hoạt; unmount gỡ listener | [x] |
| H1-03 | Audio engine/hook phát chồng, không pop | `src/useDrumAudio.js` | Test: nhấn nhanh nhiều lần vẫn phát; không lỗi Console | [x] |
| H1-04 | `<Pad>` là `<button type="button" aria-pressed>` | `src/Pad.jsx` | Accessibility tree: nút có tên và trạng thái pressed | [x] |
| H1-05 | `<DrumMachine>` ghép pad, keyboard, audio; trạng thái active có thời hạn (timer có cleanup) | `src/DrumMachine.jsx` | Test: phím W làm pad W `aria-pressed=true` rồi về false | [x] |
| H1-06 | Hit log `<output aria-live="polite">` (giới hạn độ dài, không spam đọc) | `src/HitLog.jsx` | Screen reader/ảnh a11y tree; test nội dung log | [x] |
| H1-07 | Decibel meter trực quan (không chỉ màu; có text/aria) | `src/LevelMeter.jsx` | Có nhãn chữ; tương phản >= 3:1 | [x] |
| H1-D | (design) Bảng màu sáng, mỗi pad một hình dạng theo nhạc cụ (trống tròn, cymbal elip, clap hình thoi...) xếp theo vị trí phím QWERTY, animation riêng cho từng âm khi gõ (kick nảy + sóng, snare rung, hi-hat co, open hat lắc, tom nhún, clap bung, crash lắc dài). Animation chạy lại mỗi hit bằng `key` theo id hit | `src/styles/tokens.css`, `src/*.module.css`, `src/Pad.jsx`, `index.html` | Test: mỗi hit tạo lại phần tử hình; ảnh chụp 375px và desktop | [ ] |
| H1-08 | CSS Modules: focus-visible, tương phản 4.5:1, vùng bấm, 375px, reduced-motion | `src/**/*.module.css` | Tab hết trang; 0 cuộn ngang ở 375px | [ ] |
| H1-09 | Kiểm tự động + tay: Lighthouse a11y 100, tab bàn phím, UniKey | `evidence/` | JSON Lighthouse, ảnh a11y tree, ghi chú thử UniKey | [ ] |
| H1-10 | (mở rộng) Script Node sinh kit 808 + copy kit Acoustic + `kits.js` (padId -> url theo kit) | `scripts/synth-kits.mjs`, `public/kits/{acoustic,electronic}/*.wav`, `src/kits.js` | Chạy script ra đủ 7 `.wav`; test: mỗi kit đủ 7 padId | [x] |
| H1-11 | (mở rộng, gộp luôn H1-03) `audioEngine` + `useDrumAudio`: graph source -> gain -> master -> analyser, `AudioContext` tạo lười + `resume()`, choke open hat bởi closed hat, humanize (rate ±3%, gain ±10%), volume/mute, `getLevelDb` | `src/audioEngine.js`, `src/useDrumAudio.js` | Test với `AudioContext` giả: N lần nhấn = N source, `onended` thì `disconnect`, choke dừng đúng node, mute đặt gain 0, dB có sàn -60 | [x] |
| H1-12 | (mở rộng) `Controls`: kit `<select>`, volume `<input type="range">` (`valueAsNumber` + `Number.isNaN`), mute; mọi ô có `<label htmlFor>` (`useId`) | `src/Controls.jsx` | Test: đổi kit gọi `setKit`; volume giữ kiểu số; a11y tree có tên | [x] |
| H1-13 | (mở rộng) `loopScheduler.js` + `looperConfig.js` (`TICK_MS=25`, `LOOKAHEAD_MS=100`, `MIN_LOOP_MS`, `SPEEDS`) | `src/loopScheduler.js`, `src/looperConfig.js` | Test thuần: speed 0.5/1/2; cửa sổ vòng quanh; đổi speed giữ liên tục; overdub không phát đúp | [x] |
| H1-14 | (mở rộng) `useLooper`: máy trạng thái, tick `setInterval` có cleanup, Loop/Once, tốc độ đổi lúc chạy, Clear | `src/useLooper.js` | Test từng chuyển trạng thái; Once dừng cuối vòng; Loop lặp; unmount hủy interval; StrictMode không nhân đôi | [x] |
| H1-15 | (mở rộng) `LooperPanel` (Record `aria-pressed`, Overdub, Play/Stop, Clear, radio Loop/Once, range tốc độ, `<progress>` có nhãn, `role="status"` cố định) ghép vào `DrumMachine` | `src/LooperPanel.jsx`, `src/DrumMachine.jsx` | a11y tree; status đổi theo trạng thái; 375px không cuộn ngang | [ ] |

**Thứ tự thực hiện (mỗi lượt đúng một task):** H1-00, 01, 02, 10, 11 (đánh dấu cả H1-03), 04, 05, 06, 07, D, 08, 09, rồi 12, 13, 14, 15. H1-08 và H1-09 làm trước phần mở rộng để phần lõi đạt chuẩn trước; sau H1-15 phải **chạy lại** kiểm 375px và Lighthouse (H1-09) cho phần Controls và Looper.

## 4. Commit gợi ý

`docs(hw1): add drum kit spec` · `feat(hw1): pad map and drum keyboard hook` · `feat(hw1): audio trigger with aria-pressed pads` · `feat(hw1): hit log and decibel meter` · `feat(hw1): synthesized kits and kit select` · `feat(hw1): looper with overdub, speed and loop mode` · `style(hw1): wcag 2.2 aa focus, contrast and 375px` · `test(hw1): lighthouse and keyboard evidence`

AI không tự commit; bạn xem `git diff` rồi tự chạy `git commit`.

## 5. Cổng kiểm tra

```bash
grep -rnE 'keyCode|keypress|alert\(' src     # 0 dòng
npm test -- src
```

DevTools: Lighthouse Accessibility = 100; chỉ dùng bàn phím vẫn chơi được; giữ phím không flood; gõ vào ô nhập (nếu có) không kích hoạt pad.

## 6. Dễ sai

- Dùng `e.key` thay `e.code`; quên `e.repeat`; `window.addEventListener` thiếu cleanup (nhân đôi listener dưới StrictMode).
- Tạo `Audio` mới mỗi lần nhấn gây rò; `aria-pressed` không đồng bộ; hit log đọc từng phím gây ồn.
- Looper dùng `setTimeout` để phát lại thì trôi nhịp; phải lập lịch theo `AudioContext.currentTime`.
- Hit overdub bị phát đúp vì lọt vào cửa sổ lập lịch; đổi tốc độ không đặt lại anchor làm vị trí nhảy.
- `AudioContext` bị suspended nếu chưa `resume()` sau thao tác người dùng; `rAF` của meter không cleanup.
- Kiểm `target.tagName` bỏ sót `contenteditable` (slide); dùng `closest(...)`.
