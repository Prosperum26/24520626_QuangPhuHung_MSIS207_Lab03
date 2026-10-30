# TASK_DECOMPOSITION — Lab 03 (WBS tổng)

> Work Breakdown Structure cho cả Lab 3. File này chỉ giữ **bức tranh tổng**: thứ tự, ánh xạ task → commit, cổng kiểm tra. Chi tiết từng bài nằm ở file `TASK_DECOMPOSITION.md` trong folder của bài (liên kết ở §2).
> Luật: mỗi prompt AI tham chiếu **đúng một task ID**, kèm [project-rules.md](project-rules.md) và contract liên quan. Commit WBS (`docs`) đi trước commit code. Tick `[x]` chỉ khi task đã verify.

## 1. Quy ước

- **Task ID**: `X` = chung, `E1`/`E2`/`E3` = Exercise, `H1`/`H2`/`H3` = Homework. Ví dụ `E2-03`.
- **Cổng kiểm tra (gate)**: lệnh hoặc thao tác DevTools chứng minh task xong. Không có gate thì task chưa xong.
- **Commit**: mỗi cụm task = một commit atomic; message in-class theo đúng nguyên văn đề; AI không tự commit.
- **Bằng chứng**: lưu ở `evidence/` cạnh WBS của bài (ảnh DevTools, JSON Lighthouse, log).

## 2. Bản đồ bài

| Block | Bài | Thời lượng | Thư mục | WBS |
|---|---|---|---|---|
| 1 (00-40) | Cầu nối Lab 2 → 3, init, rules, WBS | 40 phút | gốc repo | mục §3 (file này) |
| 2 (40-75) | Exercise 1: `DeveloperCard` | 35 phút | `exercises/Exercise1_DeveloperCard/` | [WBS Ex1](exercises/Exercise1_DeveloperCard/TASK_DECOMPOSITION.md) |
| 3 (75-120) | Exercise 2: `ScientistDirectory` | 45 phút | `exercises/Exercise2_ScientistDirectory/` | [WBS Ex2](exercises/Exercise2_ScientistDirectory/TASK_DECOMPOSITION.md) |
| 4 (120-155) | Exercise 3: `PubgMatchTelemetry` | 35 phút | `exercises/Exercise3_PubgTelemetry/` | [WBS Ex3](exercises/Exercise3_PubgTelemetry/TASK_DECOMPOSITION.md) |
| 5 (155-180) | Bảo vệ 3 phút + giao HW | 25 phút | — | mục §5 |
| Về nhà | HW1 Drum Kit | 1 tuần | `homeworks/DrumMachine/` | [WBS HW1](homeworks/DrumMachine/TASK_DECOMPOSITION.md) |
| Về nhà | HW2 Piano 88 phím | 1 tuần | `homeworks/GrandPiano88/` | [WBS HW2](homeworks/GrandPiano88/TASK_DECOMPOSITION.md) |
| Về nhà | HW3 PVS Arena | 1 tuần | `homeworks/KraftonPubgVnArena/` | [WBS HW3](homeworks/KraftonPubgVnArena/TASK_DECOMPOSITION.md) |
| Tuỳ chọn | Bonus: Situationship FSM | không xếp lịch | `homeworks/BonusSituationship/` | [WBS Bonus](homeworks/BonusSituationship/TASK_DECOMPOSITION.md) |

Component in-class đặt ở `src/components/` (đúng checklist slide); WBS và bằng chứng của bài nằm ở folder bài.

## 3. Block 1 — Khởi tạo chung (X)

| ID | Task | Gate | Trạng thái |
|---|---|---|---|
| X0-01 | Đọc lại cầu nối Lab 2 → 3 ([Context.md §3](docs/Context.md)); trả lời miệng 3 ý: Fiber vs đệ quy, hook queue vs `stateStore[cursor]`, `Object.is` | Tự giải thích được, không nhìn tài liệu | [ ] |
| X0-02 | Chốt stack: JS + JSDoc hay TypeScript (ghi vào [project-rules.md §1](project-rules.md)) | Một lựa chọn duy nhất | [ ] |
| X0-03 | Khởi tạo Vite + React 19 trong repo này (giữ nguyên `docs/`, `exercises/`, `homeworks/`) | `npm run dev` hiện trang; `package.json` có `react@19` | [ ] |
| X0-04 | Cài Vitest + jsdom + `@testing-library/react` + `@testing-library/jest-dom`; `setupFiles` có `afterEach(cleanup)`; script `test` | `npm test` chạy (0 test cũng được) | [ ] |
| X0-05 | `src/main.jsx` dùng `createRoot` + `StrictMode`, kiểm `#root` tồn tại | Không còn `ReactDOM.render`, `import * as React` | [ ] |
| X0-06 | `.gitignore` (`node_modules/`, `dist/`); dọn template mẫu Vite thừa | `git status` chỉ còn file có chủ đích | [ ] |
| X0-07 | Nạp `project-rules.md` cho công cụ AI đang dùng (Cursor `.cursorrules`, hoặc đọc `Agents.md`) | AI trả lời được 3 luật cấm khi hỏi | [ ] |
| X0-08 | Chuẩn bị avatar local: cắt/resize từ `C:\Dev\Project\MSIS207_Lab1\Exercise_3\assets\hero-avatar-320.jpg` thành `src/assets/avatar-128.webp` (128×128) | File tồn tại, vài KB, import được từ Vite | [ ] |
| X0-09 | ESLint: `eslint-plugin-react-hooks` + `eslint-plugin-jsx-a11y`; script `lint` | `npm run lint` chạy sạch trên khung rỗng | [ ] |

**Commit C0** (spec): `docs: add context, agents, project rules and WBS`
**Commit C1** (init): `chore: init react19 vite & rules`

## 4. Kế hoạch commit

### 4.1 In-class (7 commit cố định + 2 commit hạ tầng)

| # | Commit | Task | Gate chính |
|---|---|---|---|
| C0 | `docs: add context, agents, project rules and WBS` | tài liệu | Link trong tài liệu mở được |
| C1 | `chore: init react19 vite & rules` | X0-01..09 | `npm test` chạy, dev server lên |
| C2 | `feat(ex1): implement semantic DeveloperCard and SkillBadge` | E1-01..07 | `grep -n '<div' src/components/DeveloperCard.jsx` = 0 dòng; test pass |
| C3 | `style(ex1): add responsive 375px CSS module` | E1-08..10 | 375px không cuộn ngang |
| C4 | `feat(ex2): normalize smartPeople schema with stable IDs` | E2-01..02 | Mọi record có `id` duy nhất |
| C5 | `feat(ex2): add search, IQ filter & toSorted` | E2-03..06 | Profiler: 1 ký tự = đúng 1 lần render |
| C6 | `feat(ex2): add delete/reset & live status` | E2-07..10 | Xoá giữ focus và key; `role="status"` đúng |
| C7 | `feat(ex3): implement PUBG VN 4-state telemetry & AbortController` | E3-01..06 | Network: request cũ `(canceled)` |
| C8 | `feat(ex3): add skeleton UI & retry alert` | E3-07..10 | Slow 3G: CLS 0,00; lỗi hiện `role="alert"` |

Tổng 9 commit (7 theo đề + 2 hạ tầng). Thêm commit tích hợp `feat(app): compose exercises in App shell` (E-APP) nếu làm thử thách C (nâng `selectedId`).

### 4.2 Homework (commit gợi ý, chốt chi tiết trong WBS từng bài)

| Bài | Commit gợi ý (mỗi dòng một commit) |
|---|---|
| HW1 | `docs(hw1): add drum kit spec` · `feat(hw1): pad map and drum keyboard hook` · `feat(hw1): audio trigger with aria-pressed pads` · `feat(hw1): hit log and decibel meter` · `style(hw1): wcag 2.2 aa focus, contrast and 375px` · `test(hw1): lighthouse and keyboard evidence` |
| HW2 | `docs(hw2): add piano spec` · `feat(hw2): midi to frequency and 88 key generator` · `feat(hw2): polyphonic synth with fifo voice stealing` · `feat(hw2): memoized PianoKey grid` · `feat(hw2): fifo recorder and abortable replay` · `test(hw2): profiler render isolation evidence` |
| HW3 | `docs(hw3): add arena spec` · `feat(hw3): usePubgAirdropTimer with visibility resync` · `feat(hw3): optimistic claim with 409 rollback` · `feat(hw3): leaderboard filter and sort` · `style(hw3): vnd formatting, a11y and 375px` · `docs(hw3): add AI failure evidence` |

## 5. Block 5 — Bảo vệ và giao bài (X5)

| ID | Task | Gate | Trạng thái |
|---|---|---|---|
| X5-01 | `git log --oneline --graph` đọc được, đủ >= 6-8 commit khớp bảng §4 | Đối chiếu từng dòng | [ ] |
| X5-02 | Chạy kiểm tra cuối (§6) | Toàn bộ pass | [ ] |
| X5-03 | Luyện 3 thử thách đột biến A/B/C trong 180 giây mỗi cái, **tắt AI** ([Context.md §6](docs/Context.md)) | Làm được không tra cứu | [ ] |
| X5-04 | Ghi ngay lỗi AI gặp trong session vào bản nháp `AI_FAILURE_AUDIT.md` | >= 3 mục có prompt, lỗi, bằng chứng | [ ] |

## 6. Kiểm tra cuối trước khi lên bàn chấm

Đối chiếu slide 34. Chạy từ gốc repo:

```bash
grep -n '<div' src/components/DeveloperCard.jsx                # 0 dòng
grep -rnE 'http://' src                                        # 0 dòng
grep -rnE 'extends (React\.)?Component|ReactDOM\.render|defaultProps|keyCode|alert\(|dangerouslySetInnerHTML|key=\{(i|idx|index)\}' src homeworks   # 0 dòng
grep -rn 'import \* as React' src homeworks                    # 0 dòng
npm test                                                       # pass
git log --oneline --graph                                      # >= 6-8 commit
```

| Hạng mục | Cách kiểm | Trạng thái |
|---|---|---|
| `project-rules.md` | File tồn tại ở gốc, đã chỉnh theo thực tế | [ ] |
| `TASK_DECOMPOSITION.md` | Tổng + từng bài; task đã tick; commit khớp | [ ] |
| `AI_FAILURE_AUDIT.md` | >= 3 lỗi, mỗi lỗi có bằng chứng DevTools và bản sửa | [ ] |
| `src/components/` | 3 file `.jsx` bắt buộc có và chạy | [ ] |
| `homeworks/` | 3 thư mục có code, test, `evidence/` | [ ] |
| Console | Không warning/error ở cả ba bài in-class | [ ] |
| 375px | Không cuộn ngang ở mọi bài | [ ] |
| Lighthouse a11y | 100 ở Ex1-Ex3 và HW1-HW3 (lưu JSON/ảnh) | [ ] |

## 7. Rủi ro và cách giảm

| Rủi ro | Giảm bằng |
|---|---|
| AI sinh `useEffect` đồng bộ filter hoặc class component | `project-rules.md` nạp sẵn; gate `grep`; ghi lại làm bằng chứng cho audit |
| Hết giờ ở Block 3 (45 phút, ba commit) | Làm đúng thứ tự E2-01 → E2-10; bỏ tính năng phụ trước, không bỏ test |
| Mock API Ex3 không tất định | Seed/tham số cho tỉ lệ lỗi và độ trễ (E3-02) để test và demo lặp lại được |
| Quên giữ bằng chứng DevTools | Chụp ngay sau mỗi gate vào `evidence/`, đặt tên có tiền tố bài |
| Không giải thích được code AI sinh | Mỗi task đọc lại diff và tự nói lý do; xoá đoạn không giải thích được |
