# HW1 Drum Kit: thiết kế

Bài: `src/homeworks/DrumMachine/` (project Vite riêng). WBS gốc: [TASK_DECOMPOSITION.md](../../../src/homeworks/DrumMachine/TASK_DECOMPOSITION.md) (H1-00 đến H1-09). Tài liệu này mở rộng WBS bằng kit tổng hợp, humanize, choke, volume, meter thật và looper (H1-10 đến H1-15). Phần mở rộng nằm ngoài scope đề; cắt được mà không ảnh hưởng điểm.

## 1. Mục tiêu và tiêu chí thành công

App React 19 + Vite với 7 pad phím `e.code`, đạt WCAG 2.2 AA và Lighthouse a11y 100. Người dùng chơi được chỉ bằng bàn phím, nghe tiếng thật qua Web Audio, thấy phản hồi trực quan (hit log, meter), và ghi được loop để chồng lớp.

Thành công khi: mọi cổng ở WBS đạt; `npm test` và `npm run lint` xanh; Lighthouse a11y = 100 (JSON lưu ở `evidence/`); không cuộn ngang ở 375px; người viết giải thích được từng file khi tắt AI.

## 2. Giả định cần bạn xác nhận

1. 7 pad (theo slide), không phải 9 như Lab 1.
2. "Lặp liên tục hay chờ" hiểu là hai chế độ: **Loop** (lặp mãi) và **Once** (phát một vòng rồi dừng, chờ bấm Play).
3. "Tốc độ lặp" là hệ số thời gian 0.5x đến 2x, bước 0.25. Chỉ co giãn nhịp, không đổi cao độ.
4. Kit Acoustic copy 7 sample từ `C:\Dev\Project\MSIS207_Lab1\Homework_2\assets\sounds\` (sample tự tổng hợp, không dính license). Kit Electronic 808 sinh mới bằng script Node.
5. Looper chỉ điều khiển bằng nút, không có phím tắt (tránh va với pad và `Space` kích hoạt nút đang focus).
6. Hit không quantize; độ dài vòng bằng khoảng thời gian giữa hai lần bấm Record.

## 3. Quyết định kiến trúc

| Quyết định | Lý do |
|---|---|
| Web Audio, nạp `AudioBuffer` một lần; mỗi hit tạo một `AudioBufferSourceNode` | Phát chồng, không rò; `onended` thì `disconnect()` |
| `AudioContext` tạo lười ở lần nhấn đầu, gọi `resume()` | Chính sách autoplay |
| Chuỗi âm: source -> gain voice -> `masterGain` -> `AnalyserNode` -> `destination` | Một chỗ chỉnh volume, một chỗ đo mức |
| Bàn phím nghe `window`, `e.code`, `e.repeat`, bỏ qua `closest('input, textarea, select, [contenteditable]')` | Sửa lỗi slide: `tagName` bỏ sót `contenteditable`. Báo lại ở AI_FAILURE_AUDIT nếu gặp lỗi thật |
| Looper lập lịch look-ahead trên `AudioContext.currentTime` (tick 25ms, nhìn trước 100ms) | `setTimeout` trôi, tab nền bị giới hạn (Context §4.7) |
| Lõi lập lịch là hàm thuần, hook chỉ nối với đồng hồ | Test với đồng hồ giả, không cần âm thanh |
| Mọi hằng số ở `drumPads.js` và `looperConfig.js` | Sửa nhanh khi bị đột biến |

## 4. Cấu trúc file

```text
src/homeworks/DrumMachine/
  scripts/synth-kits.mjs        sinh kit 808 -> public/kits/electronic/*.wav
  public/kits/acoustic/*.wav    copy từ Lab 1
  public/kits/electronic/*.wav  sinh bởi script
  src/
    drumPads.js                 PADS, padMap, ACTIVE_MS, LOG_MAX, chokeGroup
    kits.js                     KITS: kitId -> padId -> url
    useDrumKeyboard.js
    audioEngine.js              tạo graph, loadKit, play(padId, when), choke, setVolume, getLevelDb
    useDrumAudio.js             hook bọc engine: { trigger, level, volume, setVolume, kit, setKit, ready }
    Pad.jsx                     <button type="button" aria-pressed>
    HitLog.jsx                  <output aria-live="polite"> + lịch sử
    LevelMeter.jsx
    Controls.jsx                kit <select>, volume range, mute
    looperConfig.js             SPEEDS, LOOKAHEAD_MS, TICK_MS, MIN_LOOP_MS
    loopScheduler.js            hàm thuần
    useLooper.js
    LooperPanel.jsx
    DrumMachine.jsx             ghép tất cả
    App.jsx, main.jsx
    *.module.css
    test/setup.js
```

## 5. Contract

```js
/** @typedef {{ id: string, code: string, label: string, chokeGroup?: string }} Pad */
// code: 'KeyW'. padMap: Map<e.code, Pad>

// useDrumKeyboard(padMap, onTriggerPad, isEnabled = true) -> void

// useDrumAudio() -> {
//   trigger(padId: string, opts?: { when?: number }): void,   // when: giờ AudioContext
//   now(): number,                                            // ctx.currentTime (0 nếu chưa có ctx)
//   volume: number, setVolume(v: number): void, muted: boolean, setMuted(b: boolean): void,
//   kit: string, setKit(id: string): void,
//   getLevelDb(): number                                       // RMS dB, sàn -60
// }

/** @typedef {{ t: number, padId: string }} LoopEvent */  // t: giây trong thời gian vòng, 0 <= t < loopLen

// loopScheduler (thuần, không import audio):
//   positionAt(anchor, nowAudio, speed, loopLen) -> số giây trong vòng
//   eventsInWindow(events, loopLen, fromLoopT, toLoopT) -> LoopEvent[]   // có xử lý vòng quanh
//   toAudioTime(anchor, loopT, speed) -> giờ AudioContext
```

Invariant:
- `anchor = { audioTime, loopT }`: tại giờ `audioTime` thì vị trí vòng là `loopT`. Đổi tốc độ thì đặt lại anchor, không nhảy vị trí.
- Cửa sổ lập lịch liên tục: `[lastTo, now + lookahead)`. Hit overdub có `t` bằng vị trí hiện tại nên nằm trước `lastTo`, không bị phát đúp.
- Events là mảng bất biến; thêm bằng `[...prev, e]`.

## 6. Máy trạng thái looper

Trạng thái: `empty`, `recording`, `playing`, `overdubbing`, `ready` (có loop nhưng đang dừng).

| Từ | Hành động | Đến | Ghi chú |
|---|---|---|---|
| empty | Record | recording | `startAudioTime = now`; hit ghi với `t = now - start` |
| recording | Record/Stop | playing | `loopLen = now - start`; nếu không có hit hoặc `loopLen < MIN_LOOP_MS` thì về empty |
| playing | Overdub | overdubbing | hit mới thêm với `t = positionAt(...)` |
| overdubbing | Overdub | playing | |
| playing / overdubbing | Stop | ready | |
| ready | Play | playing | bắt đầu lại từ `t = 0` |
| playing, mode Once | hết vòng | ready | không lặp |
| mọi trạng thái có loop | Clear | empty | xoá events |

Thông số chỉnh được (đổi lúc đang chạy):
- **Chế độ**: Loop / Once (`<fieldset>` radio).
- **Tốc độ**: `<input type="range">` 0.5 đến 2, bước 0.25, đọc bằng `valueAsNumber` kèm `Number.isNaN`, hiển thị `<output>`.

## 7. Trợ năng

- Pad: `<button type="button" aria-pressed>`, vùng bấm >= 24x24 (làm to hơn, khoảng 7rem), tên từ `label` + `kbd`.
- Hit log: `<output aria-live="polite" aria-atomic="true">` chỉ chứa hit mới nhất ("Kick, phím A"). Lịch sử 8 hit gần nhất là `<ol>` nằm ngoài vùng live, nên không bị đọc từng phím.
- Meter: thanh trực quan `aria-hidden` kèm chữ dB cập nhật khoảng 10 lần/giây, không nằm trong vùng live. Ngưỡng màu có kèm nhãn chữ và hình dạng, không chỉ màu.
- Looper: trạng thái báo qua `role="status"` cố định ngoài cây render (cùng ý với `announce.js` ở Lab 2). Nút Record dùng `aria-pressed`. Tiến trình vòng là `<progress>` có nhãn.
- Mọi `<input>` và `<select>` có `<label htmlFor>` qua `useId()`.
- Focus rõ (`:focus-visible`), `prefers-reduced-motion` tắt hiệu ứng nháy, tương phản 4.5:1 chữ và 3:1 thành phần, 375px không cuộn ngang.
- Không tự khẳng định "đạt WCAG". Ghi rõ đã kiểm tiêu chí nào và bằng cách nào (Accessibility tree, Lighthouse, tab bàn phím).

## 8. Xử lý lỗi và biên

- File âm lỗi hoặc `decodeAudioData` lỗi: pad vẫn nhấn được nhưng im lặng, hiện thông báo `role="alert"`, không `alert()`.
- `AudioContext` chưa có (jsdom, trình duyệt cũ): `trigger` không làm gì, không ném lỗi.
- Đổi kit lúc đang phát: hit cũ phát nốt, hit mới dùng kit mới.
- Unmount: `clearTimeout` mọi timer pad, `clearInterval` tick looper, `cancelAnimationFrame`, `removeEventListener`, `ctx.close()`.
- StrictMode: effect chạy hai lần không được nhân đôi listener hay interval.

## 9. Kiểm chứng

Vitest + jsdom + RTL. `AudioContext` mock bằng lớp giả có `currentTime` điều khiển được.

| Phạm vi | Test chính |
|---|---|
| drumPads | 7 pad, `code` duy nhất, `padMap` đủ khoá |
| useDrumKeyboard | `e.code`; `e.repeat` bị bỏ; gõ trong input/textarea/select/contenteditable không kích hoạt; unmount gỡ listener; StrictMode không đúp |
| audioEngine | nhấn nhanh N lần tạo N source; choke dừng open hat khi closed hat; volume và mute đổi gain; `getLevelDb` có sàn |
| Pad / DrumMachine | phím W làm `aria-pressed=true` rồi về false sau `ACTIVE_MS`; click cũng kích hoạt; không `<div>` ở thành phần ngữ nghĩa theo luật dự án |
| HitLog | live region chứa hit mới nhất; lịch sử tối đa `LOG_MAX` |
| loopScheduler | `positionAt` đúng với speed 0.5/1/2; `eventsInWindow` xử lý vòng quanh; đổi speed giữ liên tục; hit overdub không phát đúp |
| useLooper | từng dòng bảng §6; Once dừng cuối vòng; Loop lặp; Clear; unmount hủy interval |

Cổng cuối: `grep -rnE 'keyCode|keypress|alert\(' src` ra 0 dòng; `grep -rn "http://" src` ra 0 dòng; Lighthouse JSON; tab bàn phím; thử UniKey tay.

## 10. Task

Giữ H1-00 đến H1-09 như WBS, thêm:

| ID | Task | File | Gate |
|---|---|---|---|
| H1-10 | Script sinh kit 808 + copy kit Acoustic + `kits.js` | `scripts/synth-kits.mjs`, `public/kits/*`, `src/kits.js` | Chạy script ra đủ 7 file `.wav`; test `kits.js` đủ 7 padId mỗi kit |
| H1-11 | `audioEngine` + `useDrumAudio`: graph, choke, volume/mute, humanize, `getLevelDb` | `src/audioEngine.js`, `src/useDrumAudio.js` | Test §9 audioEngine |
| H1-12 | `Controls` (kit, volume, mute) | `src/Controls.jsx` | Label đúng, `valueAsNumber`, đổi kit gọi `setKit` |
| H1-13 | `loopScheduler.js` + `looperConfig.js` | hai file này | Test thuần §9 |
| H1-14 | `useLooper` | `src/useLooper.js` | Test máy trạng thái |
| H1-15 | `LooperPanel` + ghép vào `DrumMachine` | `src/LooperPanel.jsx`, `src/DrumMachine.jsx` | a11y tree, status, progress |

Thứ tự thực hiện đề xuất (mỗi lượt đúng một task): H1-00, 01, 02, 10, 11, 03 (hợp nhất vào 11), 04, 05, 06, 07, 12, 13, 14, 15, 08, 09.

Ghi chú: H1-03 trong WBS gốc là "audio engine/hook"; phần đó được H1-11 thực hiện. Khi bắt đầu sẽ đánh dấu H1-03 hoàn thành cùng H1-11 trong WBS.

## 11. Commit đề xuất

Giữ 6 message của WBS, thêm: `feat(hw1): synthesized kits and kit select`, `feat(hw1): looper with overdub, speed and loop mode`. AI không tự commit; bạn xem `git diff` rồi tự chạy.

## 12. Ngoài phạm vi

Quantize, metronome/BPM, lưu loop, thêm nhạc cụ, reverb, phím tắt looper, undo từng lớp overdub.
