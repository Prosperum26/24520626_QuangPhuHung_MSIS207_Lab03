# TASK_DECOMPOSITION — Homework 2: 88-Key Polyphonic Piano & FIFO Sequencer

> WBS con của [TASK_DECOMPOSITION.md](../../../TASK_DECOMPOSITION.md). Mỗi prompt AI = đúng một task ID. Nối tiếp `memo()` và `AudioTaskQueue` FIFO của Lab 2 (`C:\Dev\Project\24520626_QuangPhuHung_MSIS207_Lab02\Homework2_Lab02`).
> **Mỗi bài là một project Vite độc lập** (có `package.json`, `node_modules/` riêng). Chạy mọi lệnh `npm` ngay trong folder này; đường dẫn file bên dưới tính từ folder này.

## 1. Mục tiêu và phạm vi

Piano 88 phím (A0 đến C8) phát đa âm bằng Web Audio, tối đa 8 voice (steal FIFO), mỗi phím là component `React.memo`, kèm bộ ghi và phát lại FIFO ở tốc độ 0,5x/1,0x/2,0x.

**Ràng buộc cứng:**
- Sinh 88 phím **bằng thuật toán** (MIDI 21 đến 108: 52 trắng + 36 đen), tần số `440 * 2 ** ((midi - 69) / 12)`. Cấm hardcode 88 thẻ.
- 8 voice đồng thời; nốt thứ 9 lấy voice **cũ nhất** (`Map` giữ thứ tự chèn).
- Nhấn 1 phím chỉ render lại **đúng phím đó** (Profiler), không phải cả 88.
- Click-free: ramp `exponentialRampToValueAtTime(0.0001, now + 0.04)` rồi mới `osc.stop()`; `disconnect` node.
- Stop Sequence/unmount hủy toàn bộ phát lại (AbortController) và tắt oscillator.
**Ngoài phạm vi:** velocity theo lực nhấn, MIDI thiết bị, lưu bản ghi.

## 2. Contract

```js
/** @typedef {{ midi:number, noteName:string, isBlack:boolean, freqHz:number }} KeyDef */
/** @typedef {{ midi:number, freqHz:number, durationMs:number, deltaMs:number }} NoteEvent */   // trong hàng đợi FIFO
// buildKeys(): KeyDef[]  (88 phần tử, midi 21..108)
// midiToFreq(midi): number
// class PolyphonicSynth { constructor(maxVoices=8); noteOn(midi, freqHz); noteOff(midi); stopAll() }
// PianoKey = memo(function PianoKey({ midi, noteName, isBlack, isPressed, onNoteOn, onNoteOff }) {...})
```

- `onNoteOn`/`onNoteOff` ổn định tham chiếu (`useCallback`) và nhận `midi` để `memo` hoạt động; `isPressed` là boolean riêng từng phím (không truyền cả `Set` xuống).
- `AudioContext` tạo lười sau thao tác người dùng.
- Phím bàn phím máy tính (tuỳ chọn) dùng `e.code`, `e.repeat`; phím đàn truy cập được bằng bàn phím (WCAG 2.1.1).
- Trong ví dụ lớp `PolyphonicSynth`, sửa lỗi gõ `this.cbx` → `this.ctx`, và bổ sung `noteOff`.

## 2.1 Quy tắc state và bộ nhớ

- `PolyphonicSynth`, `AudioContext`, `Map` voice nằm trong `useRef`/module, **không** vào state (đổi chúng không gây render).
- Chỉ `isPressed` từng phím nằm trong state (một `Set` ID ở `GrandPiano`, mỗi `PianoKey` nhận boolean riêng). `buildKeys()` gọi một lần (module-level), không tính lại mỗi render.
- Mỗi voice kết thúc: ramp, `osc.stop()`, `osc.disconnect()`, `gain.disconnect()`, xoá khỏi `Map`; `onended` dọn tham chiếu. Test: sau `stopAll()` thì `voices.size === 0`.
- Một `AudioContext` duy nhất cho cả app; đóng khi unmount.
- Nếu Profiler cho thấy cha render 88 phần tử gây chậm, cân nhắc `useSyncExternalStore` với store nhỏ để mỗi phím tự đăng ký; chỉ làm khi đo được.

## 3. Task

| ID | Task | File | Gate | Trạng thái |
|---|---|---|---|---|
| H2-00 | Khởi tạo project Vite riêng: sao chép `package.json` (đổi `name`), `vite.config.js`, `eslint.config.js`, `index.html`, `src/main.jsx`, `src/test/setup.js` từ Ex1, rồi `npm install` | `package.json`, `vite.config.js`, `eslint.config.js`, `index.html`, `src/main.jsx`, `src/test/setup.js` | `npm test` và `npm run lint` chạy được | [ ] |
| H2-01 | Spec + `midiToFreq` + tên nốt | `src/music/notes.js` | Test: A4 (69) = 440 Hz; A0 = 27,5 Hz; C8 ≈ 4186 Hz | [ ] |
| H2-02 | `buildKeys()` 88 phím, 52 trắng + 36 đen | `src/music/notes.js` | Test: độ dài 88, đếm trắng/đen đúng, midi 21..108 | [ ] |
| H2-03 | `PolyphonicSynth`: noteOn/noteOff, ADSR click-free | `src/audio/PolyphonicSynth.js` | Test (AudioContext giả): ramp trước stop, disconnect | [ ] |
| H2-04 | Giới hạn 8 voice + steal FIFO | `src/audio/PolyphonicSynth.js` | Test: nốt thứ 9 đẩy nốt đầu tiên; thứ tự đúng | [ ] |
| H2-05 | `PianoKey` bằng `memo`, `aria-pressed`, vùng bấm hợp lệ | `src/components/PianoKey.jsx` | Test: đổi `isPressed` của phím khác → không render lại | [ ] |
| H2-06 | `GrandPiano` bố cục 88 phím + trạng thái pressed | `src/components/GrandPiano.jsx` | Profiler: nhấn 1 phím = 1 component render | [ ] |
| H2-07 | Bộ ghi FIFO `{midi,freqHz,durationMs,deltaMs}` | `src/audio/recorder.js` | Test: thứ tự ghi giữ nguyên | [ ] |
| H2-08 | Phát lại bất đồng bộ 0,5x/1x/2x + `AbortController` | `src/audio/sequencer.js` | Test: Stop hủy sớm, không còn tiếng | [ ] |
| H2-09 | UI Record/Play/Stop/Tốc độ, thông báo `role="status"` | `src/components/Sequencer.jsx` | Điều khiển bằng bàn phím; nhãn rõ | [ ] |
| H2-10 | CSS Modules, 375px (cuộn ngang có chủ đích cho bàn phím piano hoặc co giãn) | `src/**/*.module.css` | Trang không cuộn ngang ngoài vùng đàn; tương phản đạt | [ ] |
| H2-11 | Bằng chứng: Profiler render isolation, Lighthouse | `evidence/` | Ảnh Profiler, JSON Lighthouse | [ ] |

## 4. Commit gợi ý

`docs(hw2): add piano spec` · `feat(hw2): midi to frequency and 88 key generator` · `feat(hw2): polyphonic synth with fifo voice stealing` · `feat(hw2): memoized PianoKey grid` · `feat(hw2): fifo recorder and abortable replay` · `test(hw2): profiler render isolation evidence`

## 5. Cổng kiểm tra

```bash
grep -rnE 'keyCode|alert\(|innerHTML' src   # 0 dòng
npm test -- src
```

DevTools: Profiler ghi một lần nhấn → chỉ `PianoKey` đó render; giữ 9 phím → voice cũ nhất tắt; Stop khi đang phát lại → im lặng ngay.

## 6. Dễ sai

- `memo` mất tác dụng vì truyền object/hàm mới mỗi render; truyền cả `pressedSet`.
- Không ramp trước `stop` (tiếng pop); không `disconnect` → rò node; `noteOn` lặp khi giữ phím (thiếu `e.repeat`).
- Phím kẹt khi rời ngón khỏi phím (thiếu `onPointerLeave`/`onPointerCancel`).
