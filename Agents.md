# Agents.md — Hướng dẫn cho AI agent (Lab 03)

Đọc [docs/Context.md](docs/Context.md) và [project-rules.md](project-rules.md) trước. File này là **luật làm việc**: AI sinh code, con người kiểm chứng. Không chấp nhận output chưa kiểm chứng.

## 1. Nguyên tắc

1. **Atomic**: mỗi lượt chỉ làm **một** sub-task trong `TASK_DECOMPOSITION.md` của bài đang làm. Bắt đầu từ [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md) (tổng) để biết bài nào, rồi mở file WBS trong folder của bài đó. Không gộp nhiều task, không dán nguyên đề bài vào làm một lần (one-shot prompting bị 0% ở mục Git và Audit).
2. **Contract-first**: có props/state contract (JSDoc hoặc TypeScript) trước, rồi mới viết component.
3. **Verify-before-claim**: chỉ nói "xong" khi đã chạy test/lệnh kiểm chứng và thấy output thật.
4. **Giải thích được**: người dùng sẽ bị giảng viên sửa mã ngay tại chỗ khi **tắt hết AI**. Mã đơn giản, mỗi quyết định kiến trúc ở một chỗ, kèm lý do ngắn.
5. **Đúng scope**: Tier 1 thì cài đặt; Tier 2 chỉ giải thích khi cần để debug; Tier 3 không làm (xem [Context.md §2](docs/Context.md)).

## 2. Quy trình mỗi task (4 giai đoạn)

1. **Slice** — xác nhận task thuộc dòng nào của WBS (ví dụ `E2-03`).
2. **Contract** — viết/cập nhật props, state, invariant.
3. **Generate** — viết đúng một component/hook/module.
4. **Verify** — chạy test, xem `git diff`, kiểm tra bằng DevTools (Accessibility tree, Profiler, Network, 375px); báo kết quả thật, kể cả khi fail.

Nếu yêu cầu mơ hồ hoặc phải đoán, **hỏi một câu ngắn** thay vì tự bịa.

## 3. Quy tắc code (bắt buộc, chi tiết ở project-rules)

**Cấm** (vi phạm là lỗi, không phải gợi ý):
- `class ... extends React.Component`, `ReactDOM.render`, `Component.defaultProps`, `import * as React`.
- `keyCode`, `keypress`, `window.alert()`, `dangerouslySetInnerHTML`, `innerHTML`.
- `key={index}` hoặc key là chuỗi có thể trùng; mutate state tại chỗ (`push`, `splice`, `sort` trên state).
- `useEffect` để đồng bộ state dẫn xuất (filter/sort); `useEffect` có timer/listener/fetch mà không cleanup.
- `<div>` trong `DeveloperCard.jsx`; `<input>`/`<select>` không có `<label htmlFor>`; ba thẻ `<h1>` cho dữ liệu key-value.
- `<button>` không có `type`; URL `http://`; inline `style={{...}}` cho trình bày.
- `var`, biến global ngầm, hook gọi có điều kiện.

**Phải**:
- React 19 + Vite, `createRoot` + `<StrictMode>`, import hook tường minh (`import { useState } from 'react'`).
- Function component thuần, ES6 default parameter thay cho defaultProps.
- Thẻ ngữ nghĩa: `<main>`, `<section>`, `<article>`, `<header>`, `<hgroup>`, `<dl>/<dt>/<dd>`, `<output>`, `<Fragment key>`.
- `useId()` + `<label htmlFor>`; số đọc bằng `e.target.valueAsNumber` kèm `Number.isNaN`.
- State bất biến: `[...prev, x]`, `prev.filter(...)`, `.toSorted(...)`.
- Mọi effect có cleanup (`clearTimeout`, `clearInterval`, `removeEventListener`, `controller.abort()`); bỏ qua `AbortError`.
- Phím tắt dùng `e.code`, chặn `e.repeat`, bỏ qua khi đang gõ trong input.
- CSS Modules + Custom Properties; 375px không cuộn ngang.

### Khả năng truy cập (WCAG 2.2 AA)

Chi tiết ở [project-rules.md §8](project-rules.md). Không tự khẳng định "đạt WCAG" khi chưa kiểm tra; ghi rõ đã kiểm tiêu chí nào và bằng cách nào (Accessibility tree, Lighthouse, tab bàn phím). Tài liệu Markdown cũng theo WCAG: heading phân cấp, link có mô tả, code block có ngôn ngữ, ảnh có alt, không dùng emoji để mang nghĩa.

### Sẵn sàng cho bảo vệ trực tiếp (25% điểm)

Giảng viên đổi một yêu cầu trên code đang chạy, có 180 giây để sửa và kiểm chứng. Ba thử thách đã công bố nằm ở [Context.md §6](docs/Context.md). Hệ quả cho agent: đừng đóng gói quá mức, đừng thêm thư viện hay abstraction mà người dùng không giải thích được, giữ `selectedId`, `watchlist`, polling interval ở những chỗ dễ nâng state lên hoặc thêm vào.

## 4. Kiểm chứng

- Test runner: Vitest + jsdom + React Testing Library (giả định, xem Context.md §8). Mỗi component/hook có test đi kèm.
- Test tối thiểu theo bài (đầy đủ ở WBS từng folder):
  - Ex1: render đúng landmark `article` có tên, `dl` đủ cặp `dt/dd`, ảnh có `width/height/alt` và fallback chữ cái đầu, **không có `<div>`**.
  - Ex2: lọc không phân biệt hoa thường, `valueAsNumber` giữ kiểu số, `toSorted` không đổi mảng gốc, xoá giữ đúng key, reset khôi phục, `role="status"` đếm đúng.
  - Ex3: đủ 4 trạng thái, đổi squad nhanh thì abort request cũ, không hiện lỗi giả khi `AbortError`, retry chạy lại effect.
  - HW1: `e.code`, `e.repeat`, bỏ qua input, `aria-pressed`, hit log `aria-live`.
  - HW2: tần số `440 * 2^((midi-69)/12)`, đủ 88 phím (52 trắng + 36 đen), tối đa 8 voice và steal FIFO, replay hủy được.
  - HW3: timer đúng sau `visibilitychange`, giữ hàng lạc quan và rollback khi 409, chống bấm đúp, định dạng VND, lọc/sắp xếp bảng xếp hạng.
- Lệnh kiểm tra lặp lại (không cần AI): `grep -rn "<div" src/components/DeveloperCard.jsx` và `grep -rn "http://" src` đều phải ra 0 dòng.
- Trước khi báo hoàn thành: chạy test + lint, dán kết quả thật.

## 5. Git

- **AI không tự commit, không push.** AI sửa file, rồi đề xuất cách chia commit (file nào, message gì). Người dùng xem `git diff` và tự chạy `git commit` (tiếp nối quy tắc Lab 1).
- Mỗi task (hoặc cụm task) xong = một commit atomic, Conventional Commits. Đề bài chốt sẵn một số message, dùng đúng nguyên văn (xem [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md)).
- Cần tổng cộng **ít nhất 6-8 commit** khớp WBS cho phần in-class.
- Không `--force`, không `--no-verify`. Không commit file không liên quan, không commit `node_modules/`, `dist/`.
- Khi người dùng yêu cầu AI commit, thêm cuối message: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## 6. Artifact cần giữ

| File | Vai trò |
|---|---|
| [docs/Context.md](docs/Context.md) | Bối cảnh, phạm vi, kiến thức, lỗi trong slide |
| [Agents.md](Agents.md) | Luật cho AI (file này) |
| [project-rules.md](project-rules.md) | Quy tắc dự án để nạp cho AI (tương đương `.cursorrules`) |
| [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md) | WBS tổng, ánh xạ task sang commit |
| `exercises/*/TASK_DECOMPOSITION.md`, `homeworks/*/TASK_DECOMPOSITION.md` | WBS chi tiết từng bài, tick `[x]` khi đã verify |
| [AI_FAILURE_AUDIT.md](AI_FAILURE_AUDIT.md) | Báo cáo ít nhất 3 lỗi AI có bằng chứng DevTools (15% điểm) |
| `docs/prompt_logs/` | Export session AI cho mỗi lần code mỗi bài |
| `*/evidence/` | Ảnh chụp DevTools, JSON Lighthouse, log kiểm chứng |

Với `AI_FAILURE_AUDIT.md`: nội dung do người dùng viết từ lỗi **thật** đã gặp. AI chỉ chỉnh câu chữ/định dạng, **không bịa** prompt, bằng chứng, commit hash hay kết quả DevTools.

## 7. Cách trả lời người dùng

- Tiếng Việt, thuật ngữ kỹ thuật giữ tiếng Anh. Ngắn gọn, nói thẳng kết quả.
- Nêu rõ đã verify gì và chưa verify gì. Test fail thì nói và dán output.
- Phát hiện slide/đề sai hoặc mơ hồ (xem [Context.md §9](docs/Context.md)) thì báo, đừng im lặng chép theo.
- Việc ngoài scope hoặc khó đảo ngược (xoá file, đổi stack, cài dependency lớn): hỏi trước.
- Slide dạy cú pháp, không dạy nội dung: dữ liệu demo (Tran Vinh Khiem, smartPeople, squad PUBG) chỉ dùng làm dữ liệu mẫu trong đúng bài đó.
