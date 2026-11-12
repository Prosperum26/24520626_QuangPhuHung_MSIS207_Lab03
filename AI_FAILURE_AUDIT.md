# AI Failure Mode Audit — Lab 03

> Deliverable bắt buộc (15% điểm, cùng nhóm với Atomic Git): ít nhất **3 lỗi AI thật** kèm bằng chứng và bản sửa.
> Bốn mục đầu là lỗi thật xảy ra trong session làm Exercise 1 (bằng chứng mục 1-3 là output terminal và ảnh checklist; mục 4 là log Console đo trên Edge). Mục 5 xảy ra ở Homework 1, bằng chứng là ảnh Lighthouse chụp từ DevTools. Khi gặp lỗi có Profiler, Network hoặc Accessibility tree ở Ex2, Ex3 và homework, thay hoặc bổ sung vào đây để đủ yêu cầu "DevTools proof".
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
| 4 | Exercise 1 (E1-07) | Demo "ảnh lỗi" và favicon mặc định bắn lỗi đỏ vào Console, trái gate "Console sạch" | Log Console đo trên Edge | Đã sửa, chờ hash commit |
| 5 | Homework 1 (H1-D) | AI thêm font Google Fonts (stylesheet bên thứ ba chặn render) và tải trước 7 file WAV lúc mount mà không đo Performance; Lighthouse Performance 69 | Ảnh Lighthouse (DevTools) | Đã sửa và đo lại (Performance 69 lên 100) |
| 6 | Homework 3 (H3-00 đến H3-08) | `npm test` fail ngẫu nhiên ("failed to find the current suite"); AI kết luận "flaky, chưa rõ nguyên nhân" và thử đổi cấu hình thay vì kiểm tra cách mình chạy test (thư mục và shell) | Output `npm test` nhiều lần, đối chứng với Ex1, HW1, HW2 | Đã sửa (chạy đúng folder), chờ hash commit |
| 7 | Homework 3 (H3-07) | Đồng hồ đếm ngược dùng `<output>` (role `status`, live region) mà không tắt thông báo: đổi mỗi giây sẽ bị trình đọc màn hình đọc liên tục; lỗi chỉ lộ ra vì test gặp hai phần tử `status` | Output test; Accessibility tree (chờ ảnh DevTools) | Đã sửa, chờ ảnh và hash commit |

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

## Lỗi 4 — Khung demo làm Console có lỗi đỏ, trái gate "Console không warning/error"

### Bối cảnh

- **Task:** E1-07, khung demo `App.jsx` với các ca kiểm thử (xem [WBS Ex1](src/exercises/Exercise1_DeveloperCard/TASK_DECOMPOSITION.md)).
- **Prompt gốc của bạn:** "Ok ngon giờ hoàn thiện các task còn lại từ e07 tới e010,kiểm tra tổng quan rồi báo cáo nhanh cuối cho mình đi".
- **Điều AI tuyên bố:** chưa có (AI tự đo trước khi báo cáo và phát hiện lỗi).

### Lỗi

Để tạo ca "ảnh lỗi", AI dùng `https://avatar.invalid/missing.png`, tức mỗi lần mở trang trình duyệt phát lỗi mạng đỏ vào Console. Trang cũng không khai báo favicon nên có thêm một lỗi 404. Test đơn vị (53 pass) và lint không bắt được vì chỉ đo trình duyệt thật mới thấy; gate của đề (Console sạch ở bàn chấm) sẽ bị trừ.

Dòng AI sinh ra:

```jsx
{ id: 'broken', fullName: 'Ada Lovelace', role: 'Mathematician', avatarUrl: 'https://avatar.invalid/missing.png' },
```

### Bằng chứng

Log Console (Edge headless, dev server) từ `evidence/browser-audit.json` ở lần đo đầu, lặp lại ở mỗi lần tải trang:

```text
requestfailed: https://avatar.invalid/missing.png
error: Failed to load resource: net::ERR_NAME_NOT_RESOLVED
error: Failed to load resource: the server responded with a status ...
```

Lỗi 404 còn lại nhiều khả năng là `/favicon.ico` (suy luận: biến mất sau khi thêm `<link rel="icon" href="data:,">`, chưa kiểm trực tiếp URL).

### Bản sửa thủ công

- **Commit:** (điền hash từ `git log`)
- **Thay đổi:** ca ảnh lỗi dùng `public/broken-avatar.png` (file không phải ảnh, server trả 200 nên `onError` chạy mà không có lỗi mạng); thêm `<link rel="icon" href="data:," />`. Đo lại: Console chỉ còn debug/info, 0 error/warning.

### Bài học

Dữ liệu demo cho ca lỗi cũng phải qua gate "Console sạch". Luôn đo bằng trình duyệt thật (Console, Network) trước khi báo xong, không chỉ dựa vào test đơn vị.

## Lỗi 5 — Thêm tài nguyên bên thứ ba chặn render mà không đo Performance

### Bối cảnh

- **Task:** H1-D (làm đẹp giao diện, xem [WBS HW1](src/homeworks/DrumMachine/TASK_DECOMPOSITION.md)), sau đó H1-09 (Lighthouse).
- **Prompt gốc của bạn:** "Ok ổn nhưng giao diện xấu quá, update giao diện lên đi, bảng màu sáng 1 tí, phá cách cho các nút luôn, ngoài ra thêm tí animation khi bấm tùy thuộc vào từng loại âm thanh."
- **Điều AI tuyên bố:** báo `npm run build` thành công và các grep sạch; không đo Performance trước khi giao. Sau khi bạn gửi điểm Lighthouse, AI ghi vào `evidence/README.md` rằng điểm Performance 69 "chưa phản ánh bản nộp" vì chạy trên dev server. Đây là giả thuyết chưa được đo.

### Lỗi

Để dùng font Bricolage Grotesque, AI thêm vào `index.html` hai thẻ `preconnect` và một stylesheet từ `fonts.googleapis.com`. Request này nằm trên đường chặn render và kéo theo chuỗi HTML, CSS của Google, rồi file font. Cùng lúc, hook `useDrumAudio` tải trước cả 7 file WAV (khoảng 281 KB, cộng từ kích thước file trong `public/kits/acoustic/`) ngay lúc mount.

Lighthouse chạy trên dev server (`localhost:5173`) cho thấy ba nhóm cần tách:

- **Do lựa chọn của AI (có trong insight):** Render-blocking requests, Network dependency tree, 3rd parties.
- **Đặc trưng của dev server, không quy cho AI:** Minify JavaScript (2,959 KiB), Reduce unused JavaScript (1,366 KiB), User Timing marks (3 user timings). Tổng 4,186 KiB gồm cả bundle dev nên không tách riêng được phần WAV.
- **Chưa xác định nguyên nhân:** Forced reflow. Chưa có trace để biết là code dự án hay công cụ dev.

Việc tải trước WAV làm nặng LCP là **suy luận** (Lighthouse mô phỏng mạng chậm), chưa đo riêng.

Dòng AI sinh ra:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap" />
```

### Bằng chứng

Ảnh Lighthouse trong DevTools, dev server `localhost:5173`, lúc 08:25:29:

- [lighthouse-devtools.png](src/homeworks/DrumMachine/evidence/lighthouse-devtools.png): Performance 69, Accessibility 100, Best Practices 100, SEO 91.
- [lighthouse-metrics-devtools.png](src/homeworks/DrumMachine/evidence/lighthouse-metrics-devtools.png): First Contentful Paint 2.1 s, Largest Contentful Paint 3.6 s, Total Blocking Time 0 ms, Cumulative Layout Shift 0, Speed Index 2.1 s.
- [lighthouse-insights-devtools.png](src/homeworks/DrumMachine/evidence/lighthouse-insights-devtools.png): Render-blocking requests (ước tính tiết kiệm 160 ms), Forced reflow, Network dependency tree, 3rd parties, Minify JavaScript (2,959 KiB), Reduce unused JavaScript (1,366 KiB), Avoid enormous network payloads (4,186 KiB).

### Bản sửa thủ công

- **Commit:** `401843f`
- **Thay đổi:** tự phục vụ font từ `public/fonts/` (hai tập con `latin` 41 KB và `vietnamese` 8,6 KB, có `unicode-range` và `font-display: swap`) kèm `<link rel="preload">`; xoá ba thẻ Google; dời tải trước WAV sang `whenIdle` (sau khi trang tải xong và trình duyệt rảnh). Kiểm tra trên bản build: `grep googleapis|gstatic` trong `dist/` ra 0; JS 235 KB (gzip 74 KB), CSS 11,7 KB (gzip 3,25 KB).
- **Đo lại:** Lighthouse trong DevTools lúc 08:46:08 trên `localhost:4174` (cổng preview): Performance 69 lên **100**, Accessibility 100, Best Practices 100, SEO 91. Ảnh: [lighthouse-build-after.png](src/homeworks/DrumMachine/evidence/lighthouse-build-after.png). Ảnh chỉ cho thấy các điểm tổng; chưa lưu FCP, LCP sau khi sửa.

### Bài học

Mọi tài nguyên bên thứ ba (font, script) là một request chặn render cần đo, không chỉ là lựa chọn thẩm mỹ. Đo Performance trên bản build chứ không phải dev server, và tách phần do mình gây ra khỏi phần do công cụ dev. Giả thuyết "do dev server" phải được kiểm lại bằng bản build trước khi viết thành kết luận.

## Lỗi 6 — Chẩn đoán sai test "flaky" thay vì kiểm tra cách chạy test

### Bối cảnh

- **Task:** H3-00 đến H3-08 (dựng project HW3, xem [WBS HW3](src/homeworks/KraftonPubgVnArena/TASK_DECOMPOSITION.md)).
- **Prompt gốc của bạn:** "Bắt đầu làm tới H3-04 đi, chia nhỏ và commit luôn nhe, để mình tự thêm cop author sau."
- **Điều AI tuyên bố:** `npm test` "fail ngẫu nhiên trên máy này", "chưa tìm ra nguyên nhân gốc", rồi dùng `npx vitest run --pool=vmThreads` để lấy kết quả pass và báo cáo kèm cảnh báo.

### Lỗi

Trong folder HW3, `npm test` đôi lúc báo toàn bộ test file fail với lỗi ở `src/test/setup.js` (dòng `afterEach(cleanup)`), có lúc pass, có lúc fail. Ex1 và HW1 (cấu hình giống hệt) vẫn pass. Thay vì đối chứng cách chạy lệnh (thư mục làm việc, shell), AI thử đổi cấu hình: bật `reporters`, bật `globals`, sửa `setup.js`, xoá cache Vite, đổi `--pool`, copy cả project sang tên khác. Các thử nghiệm này không dừng được lỗi và phải hoàn nguyên. AI cũng kiểm tra xem có tiến trình vitest nào khác đang chạy không (không có), rồi vẫn để vấn đề mở và báo là "chưa tìm ra nguyên nhân gốc".

Bạn chỉ ra nguyên nhân khả dĩ là AI không vào đúng folder bài khi chạy test (cấu trúc `src/` lồng nhau). Sau khi chạy lại đúng như vậy, test pass ngay.

### Bằng chứng

Output lỗi (lặp nhiều lần trong session):

```text
Error: Vitest failed to find the current suite. One of the following is possible:
 ❯ src/test/setup.js:5:1
      5| afterEach(cleanup);
 Test Files  1 failed (1)
      Tests  no tests
```

Sau khi chạy trong đúng folder bằng PowerShell (`Set-Location` tới `src\homeworks\KraftonPubgVnArena`), 4 lần liên tiếp:

```text
 Test Files  7 passed (7)
      Tests  61 passed (61)
```

Đối chứng bằng cách chạy thêm test của Homework 2 (`src\homeworks\GrandPiano88`), 3 lần bằng PowerShell và 3 lần bằng Bash, đều:

```text
 Test Files  10 passed (10)
      Tests  140 passed (140)
```

Giới hạn của bằng chứng: sau đó AI chạy lại HW3 bằng Bash (cả đường dẫn `C:/...` và `/c/...`, kể cả từ phiên đang ở gốc repo) thì cũng pass 6/6, nên **AI không tái hiện lại được lỗi và chưa xác nhận được cơ chế**. Quan sát duy nhất: phần lớn lần fail xảy ra khi thư mục làm việc chính của phiên Bash khác folder bài (AI chỉ `cd` trong từng lệnh); chưa đối chiếu hết các lần pass. Phần này phù hợp với giả thuyết của bạn nhưng chưa phải chứng minh.

### Bản sửa thủ công

- **Commit:** (điền hash từ `git log`)
- **Thay đổi:** không đổi mã. Quy tắc làm việc: chạy `npm test` và `npm run lint` trong terminal đã đứng sẵn ở folder bài (PowerShell `Set-Location` tới folder bài), và không sửa `vite.config.js`/`setup.js` để né lỗi khi chưa đối chứng.

### Bài học

Khi kết quả test không ổn định giữa các lần chạy, bước đầu tiên là kiểm tra môi trường chạy (thư mục, shell) và đối chứng với project tương đương đang pass, không phải đổi cấu hình hay đổi pool. Cũng không được kết luận "flaky trên máy này" khi chưa có thí nghiệm kiểm soát.

## Lỗi 7 — Đồng hồ đếm ngược là live region mà không tắt thông báo

### Bối cảnh

- **Task:** H3-07 (`CrateCard`, xem [WBS HW3](src/homeworks/KraftonPubgVnArena/TASK_DECOMPOSITION.md)).
- **Prompt gốc của bạn:** "ok tiếp tục hoàn thiện tới h3-08 đi, phong cách giao diện lấy từ 2 homeowkr trước luôn"
- **Điều AI tuyên bố:** AI viết đồng hồ bằng thẻ `<output>` theo quy tắc ngữ nghĩa của dự án (`<output>` cho giá trị tính ra) và không nhắc tới ảnh hưởng với trình đọc màn hình.

### Lỗi

`<output>` có role ngầm là `status` (live region `polite`). Số đếm ngược đổi mỗi giây nên trình đọc màn hình có thể đọc liên tục và lấn át thông báo quan trọng như "Đã giữ chỗ thành công." (cũng là `role="status"`). AI không nhận ra khi viết component; lỗi chỉ lộ ra khi chính test của AI gọi `getByRole('status')`. Việc đồng hồ thật sự bị đọc mỗi giây chưa được kiểm bằng trình đọc màn hình, chỉ suy ra từ vai trò ngầm của `<output>`.

### Bằng chứng

Output test thật lúc đó:

```text
TestingLibraryElementError: Found multiple elements with the role "status"
 FAIL  src/components/CrateCard.test.jsx > CrateCard > Claim thành công: kho giảm, role="status" báo bằng chữ
```

Ảnh Accessibility tree của đồng hồ (chờ bạn chụp theo [evidence/README.md](src/homeworks/KraftonPubgVnArena/evidence/README.md), mục 3): (điền tên file ảnh)

### Bản sửa thủ công

- **Commit:** (điền hash từ `git log`)
- **Thay đổi:** thêm `aria-live="off"` cho `<output>` của đồng hồ để không phát thanh mỗi giây; test chọn thông báo claim theo nội dung và kiểm `role="status"` của riêng nó.

### Bài học

Thẻ ngữ nghĩa mang theo vai trò ngầm (`<output>` là live region). Khi dùng cho nội dung cập nhật liên tục phải chủ động tắt hoặc giới hạn thông báo, và kiểm bằng Accessibility tree chứ không chỉ bằng test.
