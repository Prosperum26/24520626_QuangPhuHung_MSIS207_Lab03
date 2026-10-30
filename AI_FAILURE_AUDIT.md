# AI Failure Mode Audit — Lab 03

> Deliverable bắt buộc (15% điểm, cùng nhóm với Atomic Git): ít nhất **3 lỗi AI thật** kèm bằng chứng và bản sửa.
> Ba mục dưới đây là lỗi thật xảy ra trong session làm Exercise 1 (phần nền và khung). Bằng chứng là output terminal và ảnh chụp checklist của giảng viên, **chưa phải DevTools**. Khi gặp lỗi có Profiler, Network hoặc Accessibility tree ở Ex2, Ex3 và homework, thay hoặc bổ sung vào đây để đủ yêu cầu "DevTools proof".
> Chỉ ghi điều đã xảy ra. Không bịa prompt, code, ảnh hay commit hash. Các ô `(điền)` do bạn bổ sung.

- **Sinh viên:** Quang Phú Hùng — 24520626
- **Môn:** MSIS207 — Lab 03
- **Công cụ AI:** Claude Code (Claude Sonnet 5.5)
- **Prompt log liên quan:** (điền: đường dẫn trong `docs/prompt_logs/` sau khi export session)

## Tổng quan

| # | Bài | Lỗi | Loại bằng chứng | Trạng thái |
|---|---|---|---|---|
| 1 | Cấu trúc repo (X0) | AI đặt `homeworks/` ở gốc repo, trong khi checklist đặt trong `src/`; còn tự bịa "bắt buộc" cho vị trí sai | Ảnh checklist + `git status` | Đã sửa, chờ hash commit |
| 2 | Khởi tạo (X0-09) | Cài ESLint bản mới nhất mà không kiểm peer dependency, `npm install` thất bại | Output `npm` (ERESOLVE) | Đã sửa, chờ hash commit |
| 3 | Exercise 1 (E1-03) | 34 test pass nhưng gate `grep '<div'` vẫn ra 1 dòng do chính comment của AI; thêm cảnh báo giả của ESLint | Output `grep`, `eslint` | Đã sửa, chờ hash commit |

## Lỗi 1 — Đọc sai cấu trúc folder của checklist và ghi nhầm là "bắt buộc"

### Bối cảnh

- **Task:** dựng lại cấu trúc folder và file theo checklist cuối slide (trước E1-01).
- **Prompt gốc của bạn:** "set up lại cấu trúc folder và file như cái cuối lại đi, mình lỡ tay set up sớm sai".
- **Điều AI tuyên bố:** đã "dựng lại theo checklist cuối slide", và ghi vào `docs/Context.md` §5 rằng `homeworks/{DrumMachine,GrandPiano88,KraftonPubgVnArena}/` là cấu trúc **bắt buộc theo slide 34**.

### Lỗi

AI chỉ đọc được slide dưới dạng văn bản đã bị làm phẳng (mất thụt đầu dòng) nên suy ra `homeworks/` ngang hàng với `src/`. Ảnh chụp checklist gốc cho thấy `homeworks/` nằm **bên trong** `src/`, ngang hàng `components/`. AI không đánh dấu đây là chỗ không chắc chắn, mà viết thẳng là "bắt buộc".

Phần sai AI sinh ra (trích từ `docs/Context.md` bản lúc đó):

```text
  src/
    components/                  (bắt buộc)
  homeworks/                     (bắt buộc)
```

### Bằng chứng

- Ảnh checklist của giảng viên do bạn gửi: `src/` chứa `components/` và `homeworks/` (lưu bản sao nếu muốn nộp kèm vào `docs/`).
- Sau khi sửa, `git status` hiện việc di chuyển:

```text
 D homeworks/DrumMachine/TASK_DECOMPOSITION.md
?? src/homeworks/
```

### Bản sửa thủ công

- **Commit:** (điền hash từ `git log`)
- **Thay đổi:** chuyển `homeworks/` vào `src/homeworks/`, sửa đường dẫn và liên kết trong `Context.md`, `TASK_DECOMPOSITION.md`, `Agents.md` và bốn WBS homework.

### Bài học

Khi nguồn là văn bản đã bị làm phẳng, các chi tiết phụ thuộc thụt đầu dòng (cây thư mục) phải đối chiếu với ảnh gốc hoặc hỏi lại. Không gắn nhãn "bắt buộc" cho điều mình suy luận.

## Lỗi 2 — Cài dependency "mới nhất" mà không kiểm peer dependency

### Bối cảnh

- **Task:** X0-09, thêm ESLint cùng `eslint-plugin-jsx-a11y`.
- **Prompt gốc của bạn:** "Ok bắt đầu thực hiện exercise 1, do E1-01 tới E1-03 thiên về nền và bộ khung, bạn thực hiện luôn trong lần này".
- **Điều AI tuyên bố:** không có (AI chạy `npm view` lấy phiên bản rồi cài thẳng).

### Lỗi

AI đã in ra `eslint 10.13.0` và `eslint-plugin-jsx-a11y 6.10.2` từ `npm view` nhưng không đối chiếu khoảng peer, rồi cài cả hai. Plugin này chỉ hỗ trợ ESLint đến 9, nên lệnh `npm install` thất bại.

### Bằng chứng

Output thật của `npm install` ở lần đầu:

```text
npm error code ERESOLVE
npm error While resolving: msis207-lab03@0.0.0
npm error Found: eslint@10.13.0
npm error   peerOptional eslint@"^10.0.0" from @eslint/js@10.0.1
npm error Conflicting peer dependency: eslint@9.39.5
npm error   peer eslint@"^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9" from eslint-plugin-jsx-a11y@6.10.2
```

### Bản sửa thủ công

- **Commit:** (điền hash từ `git log`)
- **Thay đổi:** cài `eslint@9` và `@eslint/js@9` thay vì dùng `--legacy-peer-deps` (cờ này che xung đột chứ không giải quyết). Ghi chú lý do vào [WBS tổng](TASK_DECOMPOSITION.md), dòng X0-09.

### Bài học

Phiên bản mới nhất của một gói không đảm bảo tương thích với gói khác trong cùng bộ công cụ. Đọc cột peer dependency trước khi cài, và không tắt kiểm tra để "cho qua".

## Lỗi 3 — Test xanh nhưng gate của đề vẫn đỏ, cộng cảnh báo giả của linter

### Bối cảnh

- **Task:** E1-03, `DeveloperCard` khung (xem [WBS Ex1](src/exercises/Exercise1_DeveloperCard/TASK_DECOMPOSITION.md)).
- **Prompt gốc của bạn:** cùng prompt ở Lỗi 2.
- **Điều AI tuyên bố:** `npm test` 34/34 pass, "bài đúng".

### Lỗi

Đề yêu cầu `grep -n '<div' DeveloperCard.jsx` ra 0 dòng. AI viết chú thích đầu file có chứa đúng chuỗi `<div>` ("Zero <div>: ..."), nên gate ra 1 dòng dù component không có thẻ `div` nào. Test render thật đã pass nên không bắt được. Ngoài ra `jsx-a11y/aria-role` báo lỗi giả vì prop dữ liệu `role="Mathematician"` của `DeveloperCard` bị hiểu là ARIA role.

Dòng AI sinh ra:

```jsx
 * Thẻ hồ sơ lập trình viên. Zero <div>: chỉ dùng thẻ ngữ nghĩa.
```

### Bằng chứng

Output `grep` và `eslint` ngay sau khi test pass:

```text
5: * Thẻ hồ sơ lập trình viên. Zero <div>: chỉ dùng thẻ ngữ nghĩa.

DeveloperCard.test.jsx
  8:51  error  Elements with ARIA roles must use a valid, non-abstract ARIA role  jsx-a11y/aria-role
```

### Bản sửa thủ công

- **Commit:** (điền hash từ `git log`)
- **Thay đổi:** viết lại chú thích không chứa chuỗi cấm; đặt `'jsx-a11y/aria-role': ['error', { ignoreNonDOM: true }]` trong `eslint.config.js` kèm lý do.

### Bài học

Test pass không thay cho gate của đề: phải chạy đúng lệnh kiểm chứng giảng viên sẽ chạy. Chuỗi cấm cũng không được xuất hiện trong chú thích của file mà gate quét.
