# TASK_DECOMPOSITION — Homework 2: 88-Key Polyphonic Piano & FIFO Sequencer

> WBS con của [TASK_DECOMPOSITION.md](../../../TASK_DECOMPOSITION.md). Mỗi prompt AI = đúng một task ID. Nối tiếp `memo()` và `AudioTaskQueue` FIFO của Lab 2 (`C:\Dev\Project\24520626_QuangPhuHung_MSIS207_Lab02\Homework2_Lab02`), và tái dùng khung project, pattern audio của [HW1 Drum Kit](../DrumMachine/TASK_DECOMPOSITION.md).
> **Mỗi bài là một project Vite độc lập** (có `package.json`, `node_modules/` riêng). Chạy mọi lệnh `npm` ngay trong folder này; đường dẫn file bên dưới tính từ folder này.
> **Hướng đã chốt: chỉ làm lõi, không phần mở rộng.** Lõi đã nặng (88 phím, `memo`, Profiler, steal, replay). Ít thứ thừa thì dễ giải thích khi bị sửa code tại chỗ.

## 1. Mục tiêu và phạm vi

Piano 88 phím (A0 đến C8) phát đa âm bằng Web Audio, tối đa 8 voice (steal FIFO), mỗi phím là component `React.memo`, kèm bộ ghi và phát lại FIFO ở tốc độ 0,5x/1,0x/2,0x.

**Ràng buộc cứng:**

- Sinh 88 phím **bằng thuật toán** (MIDI 21 đến 108: 52 trắng + 36 đen), tần số `440 * 2 ** ((midi - 69) / 12)`. Cấm hardcode 88 thẻ.
- 8 voice đồng thời; nốt thứ 9 lấy voice **cũ nhất** (`Map` giữ thứ tự chèn).
- Nhấn 1 phím chỉ render lại **đúng phím đó** (Profiler), không phải cả 88.
- Click-free: ramp `exponentialRampToValueAtTime(0.0001, now + 0.04)` rồi mới `osc.stop()`; `disconnect` node.
- Stop Sequence/unmount hủy toàn bộ phát lại (AbortController) và tắt oscillator.
- Cả bài đạt WCAG 2.2 AA (phím truy cập được bằng bàn phím, 375px, tương phản), Lighthouse Accessibility 100.

**Ngoài phạm vi (không làm):** velocity theo lực nhấn, MIDI thiết bị, lưu bản ghi, chọn dạng sóng, volume/meter, loop, sustain pedal, nhiều âm sắc, phím tắt bàn phím máy tính kiểu `a/s/d`.

## 2. Tái dùng từ Lab 1, Lab 2, HW1

| Nguồn | Dùng lại | Không dùng lại |
|---|---|---|
| HW1 | `package.json` (đổi `name`), `vite.config.js`, `eslint.config.js`, `src/test/setup.js`, `index.html` (preload font), `public/fonts/`, `src/styles/tokens.css` (bỏ màu từng âm), `scripts/check-contrast.mjs` | `kits`, looper, meter, HitLog, Controls |
| HW1 | Pattern `audioEngine`: nhận `createContext` từ ngoài để test bằng context giả; `AudioContext` tạo lười; hook giữ engine trong `useRef`, tạo lại được sau StrictMode cleanup (`useDrumAudio.js`) | `AudioBufferSourceNode`; piano dùng `OscillatorNode` |
| HW1 | Bài học AI Failure 5: không thêm tài nguyên bên thứ ba chặn render; đo Lighthouse trên bản build, không đo trên dev server | `whenIdle` (piano không tải trước file âm) |
| Lab 2 | Ý tưởng `memo` + so sánh nông (`React.memo` mặc định đã so nông, không port `shallowEqual` tự viết) | Code `AudioTaskQueue` (vanilla JS, class, hàng đợi tác vụ); xem quyết định D4 |

## 3. Quyết định thiết kế (cần bạn duyệt trước khi code)

| # | Quyết định | Lý do | Cách đảo nếu bị đổi yêu cầu |
|---|---|---|---|
| D1 | `isPressed` giữ trong **một `Set` ở `GrandPiano`** (`useState`, bất biến: `new Set(prev).add(midi)`); mỗi phím nhận boolean `pressed.has(midi)`. | Đơn giản, giải thích được. Cha render lại 1 lần mỗi lần bấm là **chấp nhận được**; điều cần chứng minh là 87 phím con không render. | Nếu Profiler cho thấy chậm, chuyển sang `useSyncExternalStore` (mỗi phím tự đăng ký). Chỉ làm khi đo được. |
| D2 | Phát lại dùng **một vòng `async` duy nhất** duyệt dòng thời gian đã sắp xếp, mỗi bước `await sleepUntil(mốc tuyệt đối)`, không dùng chuỗi `setTimeout` lồng. | Mốc tuyệt đối từ lúc bắt đầu nên không cộng dồn sai số; chỉ có tối đa 1 timer đang chờ nên cleanup đơn giản. | Đổi tốc độ chỉ là đổi hệ số chia ở một chỗ. |
| D3 | Gain mỗi voice **0,1** (không phải 0,2 như slide), có **attack 10 ms** từ 0. | 8 voice x 0,2 = 1,6 vượt 1,0 gây méo (clipping), mâu thuẫn mục tiêu "chống clipping". Gán gain đột ngột lúc start gây tiếng click. | Hằng số `VOICE_GAIN`, `ATTACK_S` ở `pianoConfig.js`. |
| D4 | Không port `AudioTaskQueue` của Lab 2. Hàng đợi FIFO ở đây là **mảng sự kiện** được duyệt theo thứ tự ghi. | Slide gọi là "FIFO queue" nhưng bài toán chỉ cần thứ tự ghi; thêm lớp queue là abstraction thừa. | Nếu giảng viên bắt dùng queue, bọc mảng bằng `shift()` ở `sequencer.js`. |
| D5 | Sự kiện ghi tạo **lúc `noteOn`** (với `durationMs` điền lúc `noteOff`), không đẩy lúc `noteOff`. | Hợp âm: nốt nhấn trước nhưng nhả sau sẽ bị đảo thứ tự nếu đẩy lúc nhả. | Thứ tự trong mảng = thứ tự bắt đầu nốt. |
| D6 | `deltaMs` = thời gian từ **lúc bắt đầu nốt trước** đến lúc bắt đầu nốt này; nốt đầu `deltaMs = 0`. Đồng hồ ghi là `performance.now()` (đơn điệu). | Slide không nói rõ; chốt một định nghĩa để test được. Cắt khoảng lặng đầu bản ghi. | Một hàm `startOffsets(events)` là nơi duy nhất cộng dồn. |
| D7 | Chỉ **một** thứ trong state là `Set` phím đang nhấn + `recorderStatus`. `PolyphonicSynth`, `AudioContext`, `Map` voice, bản ghi nằm trong `useRef`. | Đổi chúng không được gây render (đúng quy tắc §4). | |
| D8 | Phím đàn là `<button>`; **roving tabindex**: chỉ một phím (mặc định C4, MIDI 60) có `tabIndex=0`, phím còn lại `-1`; ArrowLeft/Right/Home/End di chuyển focus; Space/Enter nhấn giữ. | 88 điểm dừng Tab là trải nghiệm tệ và bị coi là bẫy bàn phím (WCAG 2.1.1, 2.4.3). `tabbable` là boolean, nên đổi focus chỉ render lại 2 phím. | Nếu muốn đơn giản hơn: bỏ roving, chỉ cần Tab qua 88 nút (không khuyến nghị). |
| D9 | Con trỏ: `onPointerDown` nhấn; `onPointerUp`, `onPointerLeave`, `onPointerCancel` nhả; không dùng pointer capture; chỉ `button === 0`. Cửa sổ mất focus (`blur`) thì `stopAll`. | Không có glissando (kéo qua nhiều phím) nên đơn giản; tránh phím kẹt. | |
| D10 | Tất cả hằng số tập trung ở `src/pianoConfig.js`: `MIDI_MIN=21`, `MIDI_MAX=108`, `MAX_VOICES=8`, `SPEEDS=[0.5,1,2]`, `RELEASE_S=0.04`, `VOICE_GAIN`, `ATTACK_S`. | Chuẩn bị cho thử thách trực tiếp (xem §7). | |

## 4. Contract

```js
/** @typedef {{ midi:number, noteName:string, isBlack:boolean, freqHz:number, pitchClass:number, octave:number }} KeyDef */
/** @typedef {{ midi:number, freqHz:number, durationMs:number, deltaMs:number }} NoteEvent */   // trong hàng đợi FIFO
// midiToFreq(midi): number
// noteName(midi): string                 // "C#4"; nhãn đọc: spokenName(midi) = "C thăng 4" (nốt tự nhiên giữ "C4")
// buildKeys(): KeyDef[]                  // 88 phần tử, midi 21..108, gọi một lần ở module-level
// groupByOctave(keys): { octave:number, keys:KeyDef[] }[]
// class PolyphonicSynth { constructor(maxVoices=8, { createContext, onSteal }); noteOn(midi, freqHz); noteOff(midi); stopAll(); dispose(); get voiceCount() }
// createRecorder({ now }): { start(); noteOn(midi, freqHz); noteOff(midi); stop(): NoteEvent[]; get events() }
// playSequence(events, { speed, noteOn, noteOff, signal, now, sleep }): Promise<'done' | 'aborted'>
// PianoKey = memo(function PianoKey({ midi, noteName, isBlack, pitchClass, isPressed, tabbable, onNoteOn, onNoteOff, onMoveFocus }) {...})
```

- `onNoteOn`/`onNoteOff`/`onMoveFocus` ổn định tham chiếu (`useCallback`, không phụ thuộc state) và nhận `midi` để `memo` hoạt động; `isPressed`, `tabbable` là boolean riêng từng phím. Không truyền cả `Set`, object, hay hàm mới mỗi render xuống `PianoKey`.
- `onSteal(midi)` là callback của synth khi voice bị cướp lúc phím còn đang giữ. `GrandPiano` dùng nó để bỏ `midi` khỏi `Set` (nếu không, phím bị cướp vẫn sáng).
- `AudioContext` tạo lười ở lần nhấn đầu (sau thao tác người dùng), gọi `resume()`.
- Trong ví dụ lớp `PolyphonicSynth` của slide: sửa `this.cbx` thành `this.ctx` (nếu có), bổ sung `noteOff`, dọn node, gain 0,1 + attack (D3).

## 5. Quy tắc state và bộ nhớ

- `PolyphonicSynth`, `AudioContext`, `Map` voice, recorder nằm trong `useRef`/module, **không** vào state. Hook giữ synth trong ref và tạo lại được sau cleanup của StrictMode (theo `useDrumAudio.js` của HW1).
- Chỉ `isPressed` từng phím (qua một `Set` ở `GrandPiano`) và vài trạng thái UI của sequencer nằm trong state. `buildKeys()` gọi một lần ở module-level, không tính lại mỗi render.
- Mỗi voice kết thúc: ramp, `osc.stop()`, `osc.disconnect()`, `gain.disconnect()`, xoá khỏi `Map`; `onended` dọn tham chiếu. Test: sau `stopAll()` thì `voiceCount === 0`.
- Một `AudioContext` duy nhất cho cả app; `dispose()` đóng khi unmount.
- Effect có timer/listener đều có cleanup: `window` `blur`, `AbortController` của replay.

## 6. Task

Thứ tự làm: H2-00 đến H2-07 (lõi đàn, có cổng Profiler) trước, rồi H2-08 đến H2-10 (ghi/phát lại), cuối cùng H2-11, H2-12.

| ID | Task | File | Gate | Trạng thái |
|---|---|---|---|---|
| H2-00 | Khởi tạo project Vite riêng **từ HW1** (không từ Ex1): sao chép `package.json` (đổi `name` thành `msis207-lab03-hw2-piano`), `vite.config.js`, `eslint.config.js`, `index.html`, `public/fonts/`, `src/styles/tokens.css`, `src/test/setup.js`, `scripts/check-contrast.mjs`; viết `src/main.jsx` (`createRoot` + `StrictMode`) và `src/pianoConfig.js` (D10); xoá phần chỉ dành cho drum; `npm install` | `package.json`, `vite.config.js`, `eslint.config.js`, `index.html`, `src/main.jsx`, `src/pianoConfig.js`, `src/test/setup.js` | `npm test` và `npm run lint` chạy được; không còn tham chiếu Google Fonts | [x] |
| H2-01 | Spec + `midiToFreq` + `noteName` + `spokenName` | `src/music/notes.js` | Test: A4 (69) = 440 Hz; A0 (21) = 27,5 Hz; C8 (108) ≈ 4186,01 Hz; `noteName(61)` = `C#4`; `spokenName(61)` = `C thăng 4` | [x] |
| H2-02 | `buildKeys()` 88 phím, 52 trắng + 36 đen; `groupByOctave()` | `src/music/notes.js` | Test: độ dài 88, đếm trắng/đen đúng (52/36), midi 21..108 liên tục, `key` (midi) không trùng; nhóm đầu (octave 0) có 3 phím, nhóm cuối (octave 8) có 1 phím | [x] |
| H2-03 | `PolyphonicSynth`: `noteOn`/`noteOff`, envelope click-free (attack 10 ms, release 40 ms) | `src/audio/PolyphonicSynth.js` | Test (AudioContext giả): có ramp lên khi bắt đầu; `noteOff` gọi `exponentialRampToValueAtTime(0.0001, now+0.04)` **trước** `osc.stop`; sau `onended` có `disconnect` osc và gain; `noteOn` lặp cùng `midi` không tạo voice mới | [x] |
| H2-04 | Giới hạn 8 voice + steal FIFO + `onSteal` + `stopAll` + `dispose` | `src/audio/PolyphonicSynth.js` | Test: nốt thứ 9 đẩy đúng nốt đầu tiên; thứ tự đúng qua nhiều vòng; `onSteal(midi)` được gọi đúng midi; `stopAll()` thì `voiceCount === 0`; `dispose()` đóng context; thay `maxVoices` bằng 4 thì giới hạn là 4 | [x] |
| H2-05 | `PianoKey` bằng `memo`: `aria-pressed`, `aria-label` = `spokenName`, `data-pc`, pointer + Space/Enter (`e.code`, chặn `e.repeat`), vùng bấm hợp lệ | `src/components/PianoKey.jsx` (+ `.test.jsx`) | Test: harness 3 phím, đếm số lần render bằng spy trên `spokenName` (mỗi lần `PianoKey` render gọi nó đúng 1 lần; không dùng `<Profiler>` bọc ngoài vì chính Profiler render lại cùng cha); đổi `isPressed` của phím A thì chỉ A render; đối chứng: hàm mới mỗi render thì cả 3 render; pointerdown gọi `onNoteOn(midi)` đúng 1 lần; pointerleave và pointercancel gọi `onNoteOff`; giữ Space không bắn lặp | [x] |
| H2-06 | Hook `usePiano`: synth trong ref (lười, tạo lại sau StrictMode), `Set` pressed bất biến, `press`/`release` ổn định, `onSteal`, `blur` thì nhả hết, unmount thì `dispose` | `src/usePiano.js` (+ `.test.jsx`) | Test: `press` thêm vào `Set`, `release` bỏ đi; nhấn 9 phím thì phím đầu không còn pressed; `window` `blur` thì rỗng; unmount thì `dispose` được gọi; tham chiếu `press`/`release` không đổi giữa các render | [x] |
| H2-07 | `GrandPiano`: bố cục 88 phím theo octave, roving tabindex (D8), nối với `usePiano` | `src/components/GrandPiano.jsx` (+ `.test.jsx`) | Test: render đúng 88 nút; chỉ 1 nút `tabIndex=0`; ArrowRight chuyển focus sang nút kế; không có `key={index}`. **Cổng Profiler (DevTools, thủ công):** ghi một lần nhấn thì `GrandPiano` render 1 lần + **một** `PianoKey` render, 87 phím còn lại "Did not render"; lưu ảnh | [ ] (test tự động xong; còn ảnh Profiler DevTools và nghe thử) |
| H2-08 | Bộ ghi FIFO `{midi,freqHz,durationMs,deltaMs}` (D5, D6) | `src/audio/recorder.js` (+ `.test.js`) | Test (đồng hồ giả): thứ tự ghi giữ nguyên; hợp âm (nhấn A, nhấn B, nhả A, nhả B) vẫn có thứ tự A rồi B; `deltaMs` nốt đầu = 0; `stop()` đóng nốt còn mở với `durationMs` đến lúc dừng; không ghi khi chưa `start()` | [ ] |
| H2-09 | Phát lại bất đồng bộ 0,5x/1x/2x + `AbortController` (D2) | `src/audio/sequencer.js` (+ `.test.js`) | Test (fake timers): thời điểm `noteOn`/`noteOff` đúng ở 1x; ở 2x nhanh gấp đôi, 0,5x chậm gấp đôi; abort giữa chừng thì không gọi thêm `noteOn`, trả `'aborted'`, không còn timer (`vi.getTimerCount() === 0`); bản ghi rỗng trả `'done'` ngay; nốt cùng `midi` nhả trước khi nhấn lại ở cùng mốc | [ ] |
| H2-10 | UI `Sequencer`: Record/Stop ghi, Play/Stop phát, tốc độ (radio 0,5x/1x/2x), `role="status"` báo trạng thái; nối recorder + `playSequence` vào `GrandPiano` (replay gọi cùng `press`/`release` nên phím sáng theo) | `src/components/Sequencer.jsx` (+ `.test.jsx`) | Test: Play vô hiệu khi chưa có bản ghi; Stop khi đang phát thì phím tắt hết, `voiceCount === 0`, status báo "Đã dừng"; đang phát không ghi lại; tốc độ vô hiệu khi đang phát; unmount khi đang phát thì abort; điều khiển hoàn toàn bằng bàn phím, nút có nhãn rõ, `type="button"` | [ ] |
| H2-11 | CSS Modules + token màu: bàn phím piano cuộn ngang **có chủ đích** trong vùng đàn (phím trắng tối thiểu ~28px nên 52 phím rộng hơn 375px); phần còn lại không cuộn ngang; vị trí phím đen bằng CSS theo `data-pc`, **không** inline `style`; focus-visible rõ; `prefers-reduced-motion`, `forced-colors` | `src/**/*.module.css`, `src/styles/tokens.css` | 375px: trang không cuộn ngang ngoài vùng đàn; vùng đàn cuộn được bằng bàn phím; `node scripts/check-contrast.mjs` đạt (chữ trên phím, viền phím đen/trắng 3:1, trạng thái pressed không chỉ dựa màu) | [ ] |
| H2-12 | Bằng chứng: Profiler render isolation, Lighthouse (trên bản build), a11y tree, kiểm tay; ghi `AI_FAILURE_AUDIT.md` nếu gặp lỗi AI thật | `evidence/` | Ảnh Profiler, JSON Lighthouse Accessibility 100, ảnh a11y tree phím "C thăng 4" (pressed), ảnh 375px, bảng kiểm tay ở `evidence/README.md` | [ ] |

## 7. Chuẩn bị cho thử thách trực tiếp (25% điểm)

Giảng viên đổi một yêu cầu trên code đang chạy, 180 giây. Các thay đổi có thể gặp và vị trí sửa:

| Thay đổi giả định | Sửa ở đâu |
|---|---|
| Đổi 8 voice thành 4 | `MAX_VOICES` trong `pianoConfig.js` |
| Đổi 88 phím thành 61 phím (MIDI 36 đến 96) | `MIDI_MIN`/`MIDI_MAX`; số phím trắng/đen tự suy ra |
| Thêm tốc độ 4x | `SPEEDS` trong `pianoConfig.js` |
| Steal "mới nhất" thay vì "cũ nhất" | Một dòng chọn khoá trong `noteOn` của `PolyphonicSynth` (`keys().next()` đổi sang phần tử cuối) |
| Đổi release 40 ms thành 100 ms | `RELEASE_S` |
| Chứng minh `memo` thật sự có tác dụng | Bỏ `memo` hoặc truyền `Set` xuống, chạy Profiler, thấy cả 88 phím render, rồi hoàn tác |

## 8. Commit gợi ý

Dùng đúng nguyên văn các message đề bài chốt sẵn (đánh dấu *), thêm các commit nhỏ ở giữa. AI không tự commit.

1. `docs(hw2): add piano spec` * (file này)
2. `chore(hw2): scaffold vite project from hw1` (H2-00)
3. `feat(hw2): midi to frequency and 88 key generator` * (H2-01, H2-02)
4. `feat(hw2): polyphonic synth with fifo voice stealing` * (H2-03, H2-04)
5. `feat(hw2): memoized PianoKey grid` * (H2-05, H2-06, H2-07)
6. `feat(hw2): fifo recorder and abortable replay` * (H2-08, H2-09, H2-10)
7. `style(hw2): piano layout and 375px` (H2-11)
8. `test(hw2): profiler render isolation evidence` * (H2-12)

## 9. Cổng kiểm tra

```bash
grep -rnE 'keyCode|keypress|alert\(|innerHTML|dangerouslySetInnerHTML' src   # 0 dòng
grep -rn "http://" src                                                       # 0 dòng
grep -rnE 'key=\{(i|idx|index)\}' src                                        # 0 dòng
npm test
npm run lint
npm run build
node scripts/check-contrast.mjs
```

DevTools: Profiler ghi một lần nhấn thì chỉ `PianoKey` đó render; giữ 9 phím thì voice cũ nhất tắt **và phím đó hết sáng**; Stop khi đang phát lại thì im lặng ngay; Lighthouse chạy trên `npm run preview`, không chạy trên dev server.

## 10. Lỗi trong slide / chỗ mơ hồ (đã xử lý)

| Chỗ | Vấn đề | Xử lý |
|---|---|---|
| Gain 0,2 mỗi voice | 8 voice x 0,2 = 1,6, vượt 1,0 nên méo; trái mục tiêu "chống clipping" | D3: gain 0,1 |
| `noteOn` đặt gain đột ngột | Tiếng click lúc bắt đầu, chỉ lo click lúc kết thúc | D3: attack 10 ms |
| Code mẫu thiếu `noteOff`, thiếu dọn node | Rò node, `Map` không dọn | H2-03, H2-04 |
| Steal voice nhưng UI vẫn `isPressed` | Phím kẹt sáng | `onSteal` (§4, H2-04, H2-06) |
| `PianoKey` chỉ có `onPointerDown`/`onPointerUp` | Rời ngón khỏi phím thì kẹt; không có bàn phím | D9, D8, H2-05 |
| "FIFO queue" nhưng không nói đồng hồ, không định nghĩa `deltaMs` | Không test được | D4, D5, D6 |
| 52 phím trắng không vừa 375px | Mâu thuẫn với "không cuộn ngang" của WCAG 1.4.10 | H2-11: vùng đàn cuộn có chủ đích (bàn phím nhạc là nội dung cần bố cục hai chiều, thuộc ngoại lệ của 1.4.10), phần còn lại không cuộn |
| Slide gọi hợp âm tối đa 8 nhưng 10 ngón tay có thể chạm cùng lúc | Nốt thứ 9, 10 cướp voice | Đúng hành vi mong muốn; có test H2-04 |

## 11. Dễ sai

- `memo` mất tác dụng vì truyền object/hàm mới mỗi render; truyền cả `pressedSet`; `onNoteOn` phụ thuộc state nên đổi tham chiếu.
- Không ramp trước `stop` (tiếng pop); không `disconnect` (rò node); `noteOn` lặp khi giữ phím (thiếu `e.repeat`).
- Phím kẹt khi rời ngón khỏi phím (thiếu `onPointerLeave`/`onPointerCancel`) hoặc khi cửa sổ mất focus; phím kẹt sáng sau khi bị steal.
- Đẩy sự kiện ghi lúc `noteOff` làm đảo thứ tự hợp âm.
- Phát lại bằng chuỗi `setTimeout` lồng nhau cộng dồn sai số và khó hủy; quên hủy timer khi Stop hoặc unmount.
- `AudioContext` bị đóng lúc StrictMode chạy cleanup rồi dùng lại (cần tạo lại lười).
- Dùng `key={index}` khi map phím; dùng tên nốt làm key (có thể trùng nếu bỏ octave). Dùng `midi` làm key.
- Đặt vị trí phím đen bằng inline `style` (cấm). Dùng `data-pc` + CSS.
- Đo Lighthouse trên dev server rồi kết luận Performance kém (xem Lỗi 5 trong [AI_FAILURE_AUDIT.md](../../../AI_FAILURE_AUDIT.md)).
