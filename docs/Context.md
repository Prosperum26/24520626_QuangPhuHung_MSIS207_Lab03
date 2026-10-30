# Context.md — Lab 03: Từ Mini-React (Lab 2) đến React 19 Production

> Môn: MSIS207 (Phát triển ứng dụng web) · SV: 24520626 – Quang Phú Hùng
> Nguồn sự thật về **bối cảnh, phạm vi và kiến thức** của lab. Luật làm việc với AI: [Agents.md](../Agents.md). Quy tắc dự án: [project-rules.md](../project-rules.md). Kế hoạch: [TASK_DECOMPOSITION.md](../TASK_DECOMPOSITION.md).
> Lab trước: Lab 1 (`C:\Dev\Project\MSIS207_Lab1`, HTML/CSS/JS thuần) và Lab 2 (`C:\Dev\Project\24520626_QuangPhuHung_MSIS207_Lab02`, mini-react engine). Nguồn đề: file `Slide 2.docx` (slide 2-34 của Lab 3).

## 1. Mục tiêu lab

Lab 2 tự xây engine kiểu React (VNode, `renderToDOM`, `useState` bằng cursor, event delegation, reconciliation). Lab 3 dùng **React 19 thật** và áp dụng đúng các nguyên lý đó:

1. Mount bằng `createRoot` + `StrictMode`; hiểu vì sao Fiber thay cho đệ quy đồng bộ.
2. Viết function component thuần, ngữ nghĩa, không div-soup, có CSS Modules và 375px.
3. Quản lý state bất biến, **state dẫn xuất tính trong render**, form truy cập được với `useId`.
4. Đồng bộ hệ thống ngoài bằng `useEffect` + cleanup; máy trạng thái 4 trạng thái với `AbortController`.
5. Ba bài về nhà: Drum Kit (WCAG 2.2 AA), Piano 88 phím đa âm, đấu trường PUBG VN (timer không trôi, giữ hàng lạc quan).

Triết lý xuyên suốt (giữ từ Lab 2): **AI sinh code (xác suất), developer kiểm chứng (tất định)**. Bốn nguyên tắc: HTML là nền tảng; CSS tăng cường trình bày; JS và React quản lý state (`UI = f(state)`); AI tăng tốc, kỹ sư chịu trách nhiệm chứng minh code chạy đúng.

Chủ đề miền: KRAFTON x PUBG Vietnam Series (PVS). Các đội dùng làm dữ liệu mẫu: Cerberus Esports (`ces`), The Expendables (`te`), Genius Esports (`ge`), AGG (`agg`), Roy Esports.

## 2. Phạm vi theo 3 tier

| Tier | Mức độ | Nội dung | Làm gì trong lab |
|---|---|---|---|
| **1 – CORE** | Làm chủ và bảo vệ trực tiếp | `createRoot` + `StrictMode`; function component thuần; ES6 default parameter; JSX ngữ nghĩa (`<article>`, `<dl>`); `useState` bất biến; state dẫn xuất; `useId` + form; `useEffect` + cleanup; máy trạng thái 4 trạng thái | Code + test + commit + giải thích miệng |
| **2 – AWARENESS** | Hiểu để debug và làm bài về nhà | Chuyển class sang hooks; `React.memo`/`useCallback`; Web Audio đa âm; đồng bộ đồng hồ đơn điệu (anti-drift) | Dùng khi cần, giải thích được, không đào sâu |
| **3 – LATER (Lab 4-6)** | Ngoài phạm vi | Zustand, Redux Toolkit; TanStack Router, Next.js App Router; React Server Components | Không đụng tới |

> Quy tắc scope: việc thuộc Tier 3 thì chỉ nhắc tên, không cài đặt.

### 2.1 Bài tập và đánh giá

| Bài | Chủ đề | Thời lượng | WBS |
|---|---|---|---|
| Exercise 1 | `DeveloperCard` + `SkillBadge` ngữ nghĩa, zero `<div>` | 35 phút | [Exercise1_DeveloperCard](../exercises/Exercise1_DeveloperCard/TASK_DECOMPOSITION.md) |
| Exercise 2 | `ScientistDirectory`: tìm, lọc IQ, sắp xếp, xoá/đặt lại | 45 phút | [Exercise2_ScientistDirectory](../exercises/Exercise2_ScientistDirectory/TASK_DECOMPOSITION.md) |
| Exercise 3 | `PubgMatchTelemetry`: 4 trạng thái, skeleton, abort | 35 phút | [Exercise3_PubgTelemetry](../exercises/Exercise3_PubgTelemetry/TASK_DECOMPOSITION.md) |
| Homework 1 | Drum Kit WCAG 2.2 AA, Lighthouse 100 | 1 tuần | [DrumMachine](../homeworks/DrumMachine/TASK_DECOMPOSITION.md) |
| Homework 2 | Piano 88 phím, 8 voice, FIFO sequencer | 1 tuần | [GrandPiano88](../homeworks/GrandPiano88/TASK_DECOMPOSITION.md) |
| Homework 3 | PVS Airdrop and Crate Arena | 1 tuần | [KraftonPubgVnArena](../homeworks/KraftonPubgVnArena/TASK_DECOMPOSITION.md) |
| Bonus (tuỳ chọn) | `SituationshipAnalyzer` FSM | không xếp lịch | [BonusSituationship](../homeworks/BonusSituationship/TASK_DECOMPOSITION.md) |

## 3. Cầu nối Lab 2 → Lab 3

| Chủ đề | Lab 2 (tự xây) | Lab 3 (React 19) | Ý nghĩa để bảo vệ |
|---|---|---|---|
| Mount | `renderToDOM` đệ quy đồng bộ, 5.000 node làm treo trình duyệt | `createRoot` + Fiber; mỗi Fiber có con trỏ `child`, `sibling`, `return` nên React tạm dừng được giữa các Fiber | Giải thích vì sao đệ quy không ngắt được |
| State | `stateStore[cursor]` toàn cục; một child unmount làm lệch cursor của các child sau | Hook nằm trong danh sách liên kết `fiber.memoizedState` của từng component | Cô lập vòng đời từng component |
| So sánh state | `Object.is(prev, next)` trước khi render | Cùng phép so sánh; `items.push(x); setItems(items)` không render lại | Lý do cấm mutate tại chỗ |
| Sự kiện | `setupEventDelegation(root)` một listener ở root | SyntheticEvent, React gắn listener ở root tự động | Không cần tự gắn listener từng node |
| Key | `diffChildren`, index key làm state "dính" sang item khác | `key={m.id}` bằng ID thực thể | O(n) reconciliation phụ thuộc key ổn định |
| Render lan truyền | Cascading re-render (Lab 2 slide 20) | Derived state thay cho `useEffect` + state thứ hai | Một lần nhập = một lần render |
| Bất đồng bộ | `ViewState<T>`: IDLE, LOADING, SUCCESS, ERROR | Thêm `AbortController` trong effect để loại race condition | Squad A không ghi đè Squad B |
| Memo | `memo()` + `shallowEqual` tự viết | `React.memo` cho 88 phím piano | Đo bằng Profiler |
| Hàng đợi, đồng hồ | `AudioTaskQueue`, `createAntiDriftTimer` | `usePubgAirdropTimer`, sequencer FIFO | Hook tái sử dụng được |

Dòng thời gian khi bảo vệ cần nhắc được: Lab 2 `renderToDOM` → Lab 3 `createRoot`; Lab 2 `stateStore[cursor]` → Lab 3 hook queue theo Fiber.

## 4. Kiến thức cốt lõi

### 4.1 Mounting và StrictMode

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root mount container');
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`StrictMode` ở dev chạy setup rồi cleanup rồi setup lần nữa để lộ rò rỉ sớm. Effect đúng phải chịu được điều này.

### 4.2 Component thuần và default parameter

```jsx
export function ActionButton({ label = 'Deploy Squad', variant = 'primary', disabled = false, onAction }) {
  return (
    <button type="button" className={`btn btn--${variant}`} disabled={disabled} onClick={onAction}>
      {label}
    </button>
  );
}
```

`defaultProps` bị gỡ khỏi function component ở React 19. `<button>` không `type` mặc định là `submit` trong form.

### 4.3 Ngữ nghĩa và danh sách

- `Fragment` thay wrapper div; Fragment trong `.map()` cần `key`.
- Dữ liệu cặp khóa-giá trị: `<dl><Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment></dl>` với `Object.entries(obj)`.
- Key là ID thực thể, không phải index hay chuỗi có thể trùng.
- JSX tự escape chuỗi (giống `createTextNode` ở Lab 2): không dùng `dangerouslySetInnerHTML`.

### 4.4 State dẫn xuất

Hai `useState` (danh sách gốc và danh sách đã lọc) cộng `useEffect` đồng bộ là **anti-pattern số 1 của AI**: mỗi phím gây render thứ nhất với dữ liệu cũ, rồi effect gọi setter và gây render thứ hai. Đúng là:

```jsx
const visible = people
  .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()) && p.iq >= minIq)
  .toSorted((a, b) => (sortBy === 'iq-desc' ? b.iq - a.iq : a.age - b.age));
```

`Array.prototype.sort` mutate mảng gốc; `toSorted` (ES2023) trả mảng mới.

### 4.5 Form có nhãn

`useId()` sinh id ổn định; ghép `<label htmlFor={id}>` với `<input id={id}>`. Với `type="number"`, `e.target.value` là chuỗi (`'35' + 1 === '351'`); dùng `e.target.valueAsNumber` và `Number.isNaN`. Kết quả đếm đặt trong `<output role="status" aria-live="polite">`.

### 4.6 Effect, cleanup và máy trạng thái

```jsx
useEffect(() => {
  const controller = new AbortController();
  setView({ status: 'LOADING', data: null, error: null });
  fetchTelemetry(squadId, { signal: controller.signal })
    .then((data) => setView({ status: 'SUCCESS', data, error: null }))
    .catch((err) => {
      if (err.name === 'AbortError') return;
      setView({ status: 'ERROR', data: null, error: err.message });
    });
  return () => controller.abort();
}, [squadId, retryTick]);
```

`retryTick` tăng một đơn vị để chạy lại effect khi bấm "Reconnect". `LOADING` hiển thị skeleton `aria-busy="true"` cao 220px khớp card thật; `ERROR` hiển thị `<section role="alert">`, không dùng `alert()`.

### 4.7 Đồng hồ không trôi (HW3)

`setInterval(s => s - 1, 1000)` trôi hàng phút khi tab nền bị Chrome giới hạn còn khoảng 1 tick mỗi phút. Giải pháp: tính còn lại từ mốc tuyệt đối mỗi lần tick (200ms) và ngay khi tab `visible`. Cần `serverOffsetMs` để bù lệch đồng hồ máy khách. `Date.now()` có thể bị đổi giờ hệ thống; nếu cần đơn điệu tuyệt đối, đo bước nhảy bằng `performance.now()` (xem §9).

### 4.8 Âm thanh đa âm (HW1, HW2)

- Tần số: `f = 440 * 2 ** ((midi - 69) / 12)`. 88 phím là MIDI 21 (A0) đến 108 (C8): 52 trắng + 36 đen.
- `Map` giữ thứ tự chèn nên `voices.keys().next().value` là voice cũ nhất (FIFO steal) khi đủ 8.
- Tránh tiếng "pop": `gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04)` rồi mới `osc.stop()`.
- Stop sequencer: `AbortController` hủy mọi promise phát lại và tắt oscillator đang chạy.

## 5. Cấu trúc repo (checklist cuối slide + phần mình thêm)

Bắt buộc theo slide 34: `project-rules.md`, `TASK_DECOMPOSITION.md`, `AI_FAILURE_AUDIT.md`, `src/components/{DeveloperCard,ScientistDirectory,PubgMatchTelemetry}.jsx`, `homeworks/{DrumMachine,GrandPiano88,KraftonPubgVnArena}/`. Còn lại là phần thêm của mình.

```text
24520626_QuangPhuHung_MSIS207_Lab03/
  Agents.md                      (thêm) luật cho AI
  project-rules.md               (bắt buộc) luật dự án
  TASK_DECOMPOSITION.md          (bắt buộc) WBS tổng
  AI_FAILURE_AUDIT.md            (bắt buộc) >= 3 lỗi AI
  docs/
    Context.md                   (thêm) file này
    prompt_logs/                 (thêm) export session AI
  exercises/                     (thêm) WBS + bằng chứng từng bài in-class
    Exercise1_DeveloperCard/     TASK_DECOMPOSITION.md, evidence/
    Exercise2_ScientistDirectory/
    Exercise3_PubgTelemetry/
  src/
    components/                  (bắt buộc)
      DeveloperCard.jsx          Sprint 1 (zero div)
      ScientistDirectory.jsx     Sprint 2 (derived state)
      PubgMatchTelemetry.jsx     Sprint 3 (KRAFTON PUBG VN)
  homeworks/                     (bắt buộc)
    DrumMachine/                 HW1; TASK_DECOMPOSITION.md, evidence/
    GrandPiano88/                HW2
    KraftonPubgVnArena/          HW3
    BonusSituationship/          (thêm) bonus tuỳ chọn, SituationshipAnalyzer FSM
```

File phụ của component (`*.module.css`, `SkillBadge.jsx`, hook, mock API, test) đặt cạnh component hoặc trong `src/{hooks,data,api}` khi tạo ở task tương ứng. Khung dự án Vite (package.json, vite.config) tạo ở task `X0` (commit `chore: init react19 vite & rules`).

## 6. Bảo vệ trực tiếp 3 phút (25%)

Quy trình: tắt AI → `git log --oneline --graph` đối chiếu WBS (30s) → DevTools và 375px (30s: zero warning, zero `<div>` ở Ex1, 100% `<label>` ở Ex2) → đột biến kiến trúc (60-180s).

Ba thử thách đã công bố (slide 24):

| Thử thách | Yêu cầu | Chuẩn bị thiết kế |
|---|---|---|
| A (Ex2, state dẫn xuất) | Thêm sao Watchlist cho từng người và checkbox "Show Watchlisted Only", **không thêm `useEffect`** | `watchlist` là `Set` ID (hoặc mảng ID) trong state; lọc thêm một điều kiện trong pipeline dẫn xuất |
| B (Ex3, telemetry) | Thêm auto-polling `setInterval` 5 giây với nút "Pause Radar" và cleanup đúng | Hằng `POLL_MS` một chỗ; dependency `[squadId, isPaused]`; không tạo interval mới mỗi render |
| C (Ex1 + Ex2, lift state) | Nâng `selectedId` lên `<App />`, bấm hàng ở Ex2 thì `DeveloperCard` ở Ex1 đổi theo | Component nhận dữ liệu và callback qua props, không giữ state chọn riêng |

Ví dụ đột biến từ Lab 2 vẫn có thể gặp lại (đổi ánh xạ prop, đảo logic key). Luôn kiểm chứng lại bằng DevTools sau khi sửa.

## 7. Chấm điểm (100%)

| Thành phần | Tỉ trọng | Điều kiện đạt |
|---|---|---|
| Functional Correctness & State Integrity | 30% | 3 sprint + 3 homework chạy đúng, edge case, state bất biến |
| 3-Minute Live Refactoring Defense | 25% | Tắt AI, sửa đột biến trong 180s, giải thích Lab 2 → Lab 3 |
| Responsive 375px & WCAG 2.2 AA | 15% | Không cuộn ngang, zero div-soup, 100% label, Lighthouse a11y 100 |
| Code Quality, Modern Standards & Security | 15% | Không class/`ReactDOM.render`/`defaultProps`/`keyCode`/`alert()`, không XSS |
| AI Failure Audit & Atomic Git | 15% | `project-rules.md`, WBS, >= 6-8 commit, `AI_FAILURE_AUDIT.md` có 3 lỗi đã kiểm chứng |

Cùng tỉ trọng với Lab 2.

## 8. Giả định (cần xác nhận hoặc sửa)

- **Stack**: Vite + React 19 với `.jsx`; contract bằng JSDoc (như Lab 2 dùng JS + JSDoc). Đổi sang TypeScript được nhưng chốt một lần.
- **Test**: Vitest + jsdom + React Testing Library. Slide chỉ nêu DevTools/Lighthouse; test là phần mình thêm để verify nhanh.
- **Nguồn dữ liệu telemetry**: slide gọi `fetchKraftonPubgTelemetry(squadId, { signal })` nhưng không định nghĩa. Mình tự viết mock API (độ trễ có kiểm soát, 35% lỗi mô phỏng, tôn trọng `signal`) và để seed/tham số để test tất định.
- **Giao nộp HW**: slide không nêu định dạng nộp (repo, báo cáo). Chờ đề chi tiết; mặc định lưu bằng chứng ở `evidence/` như Lab 2.
- **Bonus**: không nằm trong lịch 180 phút hay thang điểm; xem như tuỳ chọn.

## 9. Lỗi và mơ hồ trong slide (đừng chép nguyên)

Slide chép từ ảnh nên có chỗ vỡ cú pháp. Khi dùng làm đặc tả, sửa như sau:

- **Slide 14** (`DeveloperCard`): `import { Fragment) from 'react'` sai ngoặc; JSX bị vỡ (thiếu `))}` đóng map). Viết lại cho đúng cú pháp, giữ nguyên ý: `article` + `header` + `hgroup` + `dl` + `ul`. Ảnh mẫu cần `alt` có nghĩa; `alt={fullName}` ở avatar trang trí có thể gây đọc trùng tên, cân nhắc `alt=""` nếu tên đã có ngay cạnh.
- **Slide 14**: skills mô tả "dùng `<SkillBadge />`" nhưng code mẫu render `<li>` thẳng. Làm đúng mô tả: `SkillBadge` là component riêng, key bằng `s.id`.
- **Slide 17/19**: `useld`, `qid`/`qId` lẫn lộn; đúng là `useId`, một tên biến thống nhất. Cấu trúc `<form role="search">` bao `<section>` trong slide 19 bị đóng ngược; viết lại cho đúng lồng nhau.
- **Slide 19**: comparator `b.iqa.iq a.age b.age` bị vỡ; đúng là `sortBy === 'iq-desc' ? b.iq - a.iq : a.age - b.age`. `initialData = SMART_PEOPLE` dùng hằng chưa khai báo trong cùng file.
- **Slide 18**: `minIq` mặc định 160 trong mẫu. Với dữ liệu (min IQ 180) ổn, nhưng nút Reset phải khôi phục cả `query`, `minIq`, `sortBy` và `people`, không chỉ danh sách.
- **Slide 21/23**: `fetchPubgSquadTelemetry` và `fetchKraftonPubgTelemetry` là hai tên khác nhau cho cùng một việc; dùng một tên. Mock chưa tồn tại (xem §8).
- **Slide 22**: nêu map Erangel/Miramar nhưng dữ liệu có thêm Taego; chấp nhận cả ba, không bắt buộc đúng hai map. Mẫu code đang chỉ hiển thị tên và kills; nên hiển thị đủ `map`, `phase`, `alive`, `wwcdProb`, `status` và dùng `<dl>`.
- **Slide 23**: `{view.data?.name} (view.data?.kills}` thiếu `{`, nhãn "Kills:" bị lệch chỗ; `aria-live` đặt trên `article` thay vì vùng trạng thái riêng.
- **Slide 28**: `this.cbx.createOscillator()` là lỗi gõ (đúng `this.ctx`); `noteOn` tạo `AudioContext` trong handler là đúng (cần thao tác người dùng); thiếu `noteOff`, thiếu tắt oscillator sau ramp, thiếu `osc.disconnect()`.
- **Slide 27**: `className={key ${isBlack ...}'}` thiếu backtick; `onPointerUp` không đủ, thêm `onPointerLeave`/`onPointerCancel` để tránh nốt kẹt, và bàn phím phải điều khiển được phím đàn (WCAG 2.1.1).
- **Slide 29**: `'LOOTED_OUT |` thiếu dấu nháy; `dropEpoch Ms` đúng là `dropEpochMs`. Hợp đồng `PubgVnSquadStanding` ghi `squadId: 'te' | 'ces' | 'ge' | 'agg'` nhưng nội dung nhắc cả Roy Esports; cần id cho đội thứ 5 nếu dùng.
- **Slide 30**: `usePubgAirdropTimer` dùng `Date.now()`, có thể nhảy khi đổi giờ máy; ghi rõ giả định hoặc bù bằng `performance.now()`. `calcRemaining` tạo mới mỗi render nên cần đưa vào dependency hoặc định nghĩa trong effect (lint exhaustive-deps).
- **Slide 31/32 (Bonus)**: liệt kê `STRANGERS | DATING_NO_LOVE | COMMITTED | SELF_RESPECT_EXIT` nhưng code dùng `FRIENDS | DATING_NO_LOVE | OFFICIAL_LOVE | GHOSTED_EXIT`; chọn một bộ và nhất quán.
- **Slide 24 và 34**: yêu cầu "6-8 commit atomic". Phần in-class chốt sẵn 2 + 3 + 2 = 7 commit (slide 13, 18, 23), cộng 1 commit init (slide 7) = 8. Ba homework cộng thêm commit riêng, nên tổng sẽ vượt 8; mức tối thiểu cần giữ là 6.
- **Slide 5 và 25**: "5 architectural bugs" nằm trong PDF cũ `Lab3_React.pdf`, mình không có file này. Danh sách bug lấy từ slide 5; không suy diễn thêm.
- **Slide 25**: hash commit `9f4c2a1` trong ví dụ audit là mẫu, không phải của mình. Hash thật lấy từ `git log` của mình.

## 10. Bonus: SituationshipAnalyzer (tuỳ chọn)

FSM thay cho bộ boolean mâu thuẫn; reducer cho nhật ký nỗ lực bất đối xứng (`EM` 100 lần trọng số 0,1 so với `AI_DO` 1 lần trọng số 50); timer "seen không rep" 5 giây có cleanup; cảnh báo red-flag trong `<output role="status" aria-live="polite">`; 375px; commit mẫu `feat(fsm): model HenHoKhongYeu state machine` và `feat(ui): add derived red-flag meter & ghosting cleanup`. Chỉ làm sau khi xong mọi bài chấm điểm. Folder và WBS: [homeworks/BonusSituationship](../homeworks/BonusSituationship/TASK_DECOMPOSITION.md).

## 11. Tài liệu liên quan

- Quy tắc dự án: [project-rules.md](../project-rules.md)
- Luật cho AI: [Agents.md](../Agents.md)
- WBS tổng: [TASK_DECOMPOSITION.md](../TASK_DECOMPOSITION.md)
- Báo cáo lỗi AI: [AI_FAILURE_AUDIT.md](../AI_FAILURE_AUDIT.md)
