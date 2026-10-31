# TASK_DECOMPOSITION — Exercise 2: ScientistDirectory (Sprint 2, 45 phút)

> WBS con của [TASK_DECOMPOSITION.md](../../../TASK_DECOMPOSITION.md). Mỗi prompt AI = đúng một task ID. AI không commit; chỉ đề xuất, bạn tự commit.
> **Mỗi bài là một project Vite độc lập** (có `package.json`, `node_modules/` riêng). Chạy mọi lệnh `npm` ngay trong folder này; đường dẫn file bên dưới tính từ folder này.
> Ưu tiên (đã chốt): chạy đúng, nhanh, state và memory đúng trước; dễ bảo vệ sau.

## 1. Mục tiêu và phạm vi

Biến mảng `smartPeople` tĩnh thành trình khám phá dữ liệu: 1) tìm tên linh hoạt (hoa/thường, có/không dấu, khớp cụm chữ trong từ), 2) lọc IQ tối thiểu (`valueAsNumber`), 3) sắp xếp IQ/tuổi bằng `.toSorted()`, 4) xoá và đặt lại.

**Ràng buộc cứng (đề):** **0 `useEffect`** cho lọc/sắp xếp; mọi input có `<label htmlFor>` + `useId()`; số kết quả trong `<output role="status" aria-live="polite">`; key là `id`; 3 commit đúng nguyên văn (§4).
**Ngoài phạm vi:** lưu localStorage, phân trang, gọi API.

## 2. Dữ liệu: một file để bạn tự nhập

- **Nguồn duy nhất:** [src/data/people.json](src/data/people.json), bạn chỉnh trực tiếp. 6 người đầu theo slide (`sp-1` đến `sp-6`), dòng `sp-7` là chỗ của **bạn**: thay `name`, `age`, `iq` (đang là `TODO`, `0`, `0`).
- `src/data/smartPeople.js` **trích** từ JSON: import `people.json`, tạo thêm `searchKey` cho từng người, rồi `Object.freeze` (sâu). Component chỉ đọc `SMART_PEOPLE`, không đọc JSON trực tiếp, nên đổi nguồn dữ liệu chỉ sửa một chỗ.
- Schema mỗi bản ghi: `{ id: string, name: string, age: number, iq: number }` (JSON) và thêm `searchKey: string` (tính một lần lúc nạp, không nằm trong JSON).
- Gate dữ liệu (E2-01): `id` duy nhất, `age`/`iq` là số hữu hạn, không còn chuỗi `TODO` trong `people.json` **trước khi commit C4**. Dùng `min IQ` mặc định 160 thì `iq` của bạn phải >= 160 mới hiện ở lần mở đầu; không thì bạn thấy mình biến mất khỏi danh sách. Chọn `minIq` mặc định bằng hằng ở một chỗ (`DEFAULT_MIN_IQ`) nếu cần hạ xuống.

## 3. Contract

```js
/** @typedef {{ id: string, name: string, age: number, iq: number, searchKey: string }} Person */
/** @typedef {'iq-desc' | 'age-asc'} SortKey */
```

State của `ScientistDirectory` (chỉ những cái này): `people`, `query`, `minIq`, `sortBy`. `visible` tính trong render.

```js
// src/components/peopleModel.js (hàm thuần, không đụng DOM/React)
foldText(s)                        // 'Đặng Thị Ánh' -> 'dang thi anh'
matchesQuery(person, foldedTokens) // mọi token là chuỗi con của person.searchKey
selectVisible(people, { query, minIq, sortBy })  // filter + toSorted, không mutate
DEFAULT_MIN_IQ, DEFAULT_SORT
```

### 3.1 Quy tắc tìm kiếm (đã chốt)

- **Chuẩn hóa hai phía bằng `foldText`:** `toLocaleLowerCase` → `normalize('NFD')` → bỏ dấu tổ hợp (`\p{M}`) → `đ` thành `d`. Hoa/thường và có/không dấu đều khớp **cả hai chiều** (gõ "hung", "Hưng", "HƯNG" đều ra "Hưng").
- **Khớp cụm chữ trong từ (substring):** "ein" ra Einstein, "vin" ra "da Vinci".
- **Nhiều từ = AND:** tách query theo khoảng trắng, mỗi token phải là chuỗi con của tên; thứ tự không quan trọng ("hung quang" ra "Quang Phú Hưng"). Query rỗng hoặc chỉ khoảng trắng thì không lọc.
- **Tốc độ:** `searchKey` tính một lần ở dữ liệu; mỗi lần gõ chỉ `foldText(query)` một lần rồi `includes` trên 7 chuỗi ngắn. Không cần `useMemo`, `useDeferredValue`, debounce (đều thêm render hoặc độ trễ).
- Lọc IQ dùng `>=`; sắp xếp phụ theo `searchKey` khi trùng điểm để thứ tự ổn định.

### 3.2 Hiển thị mỗi người

- Mỗi dòng là `<li>` chứa **`DeveloperCard` (sao chép từ Ex1)** và nút xoá cạnh card. Ánh xạ: `fullName=name`, `role=` "Tuổi N", `metrics={{ age, iq }}`, `skills={[]}`, **`avatarUrl={null}`** (nếu không, mọi người sẽ cùng hiện ảnh mặc định của bạn). Thêm nhãn `iq: 'IQ'` vào `METRIC_LABELS` bản sao để không ra "Iq".
- Ex1 và Ex2 là hai project riêng nên đây là **bản sao**: ghi chú nguồn ở đầu file để không sửa lệch về sau.
- `heading`: `h1` trang, mỗi card một `h2`; `<ul aria-label>` cho danh sách kết quả.

### 3.3 Hành vi

- `handleDelete(id)`: `setPeople((prev) => prev.filter((p) => p.id !== id))`.
- `handleReset`: khôi phục **cả bốn state** (`people` từ snapshot `SMART_PEOPLE`, `query=''`, `minIq=DEFAULT_MIN_IQ`, `sortBy=DEFAULT_SORT`).
- Chừa chỗ cho thử thách A (watchlist): `selectVisible` là chuỗi điều kiện trong một biểu thức.

## 4. Task

| ID | Task | File | Gate | Trạng thái |
|---|---|---|---|---|
| E2-00 | Khởi tạo project Vite riêng: sao chép `package.json` (đổi `name` thành `msis207-lab03-ex2`), `vite.config.js`, `eslint.config.js`, `index.html`, `src/main.jsx`, `src/test/setup.js`, `src/styles/tokens.css` từ Ex1, rồi `npm install` | các file cấu hình | `npm test` và `npm run lint` chạy được | [ ] |
| E2-01 | Nạp dữ liệu: `src/data/smartPeople.js` trích `people.json`, thêm `searchKey`, đóng băng; bạn nhập `sp-7` | `src/data/smartPeople.js` (+ test) | Test: `id` duy nhất, số hữu hạn, frozen; `grep TODO src/data/people.json` = 0 | [ ] |
| E2-02 | `foldText`, `matchesQuery`, `selectVisible` (hàm thuần) | `src/components/peopleModel.js` (+ test) | Test: Hoa/thường, có/không dấu hai chiều, `đ`, substring, nhiều token, query rỗng, không mutate | [ ] |
| E2-03 | Sao chép `DeveloperCard` + `SkillBadge` + `developerCardModel` từ Ex1, thêm nhãn `IQ` | `src/components/DeveloperCard.jsx`, `SkillBadge.jsx`, `developerCardModel.js`, `DeveloperCard.module.css` | Test của card chạy trong Ex2; `grep '<div'` = 0 | [ ] |
| E2-04 | Khung `ScientistDirectory`: `<ul>` key `p.id`, mỗi `<li>` một card | `src/components/ScientistDirectory.jsx` | Không warning key; đủ 7 người | [ ] |
| E2-05 | Ô tìm tên: `useId`, `<label htmlFor>`, `type="search"`, dùng `selectVisible` | `ScientistDirectory.jsx` | Test: "hung", "HƯNG", "ein", "  EIN ", "vin" | [ ] |
| E2-06 | Ô Min IQ: `type=number`, `valueAsNumber`, `Number.isNaN` → 0 | `ScientistDirectory.jsx` | Test: gõ rỗng không `NaN`; `minIq` luôn là number | [ ] |
| E2-07 | `<select>` sắp xếp có label; `.toSorted()` | `ScientistDirectory.jsx` | Test: mảng `people` gốc không đổi thứ tự | [ ] |
| E2-08 | Kiểm render: 1 ký tự gõ = đúng 1 render pass | Profiler | Ảnh Profiler trong `evidence/`; `grep useEffect` = 0 | [ ] |
| E2-09 | Nút xoá từng người (tên truy cập có tên người), xoá bất biến, chuyển focus có chủ đích | `ScientistDirectory.jsx` | Test: xoá giữa danh sách, key còn lại giữ nguyên; focus không về `<body>` | [ ] |
| E2-10 | Nút Reset khôi phục toàn bộ | `ScientistDirectory.jsx` | Test: sau reset mọi điều khiển và danh sách về mặc định | [ ] |
| E2-11 | `<output role="status" aria-live="polite">` "Found N pioneers" + trạng thái rỗng bằng chữ | `ScientistDirectory.jsx` | Test: N khớp; rỗng có thông báo | [ ] |
| E2-12 | `ScientistDirectory.module.css`, `App.jsx`, 375px; đo Edge/axe/Lighthouse lưu `evidence/` | `*.module.css`, `src/App.jsx`, `evidence/` | 0 cuộn ngang; axe 0 vi phạm; Lighthouse a11y 100; Console sạch | [ ] |

## 5. Commit (đề chốt 3 commit; AI không commit)

| Commit | Message (nguyên văn đề) | Task |
|---|---|---|
| C4 | `feat(ex2): normalize smartPeople schema with stable IDs` | E2-00 đến E2-04 (khởi tạo project, dữ liệu có `id`, hàm thuần, khung danh sách) |
| C5 | `feat(ex2): add search, IQ filter & toSorted` | E2-05 đến E2-08 |
| C6 | `feat(ex2): add delete/reset & live status` | E2-09 đến E2-12 |

Thứ tự trong C4: scaffold trước, nhưng nếu muốn commit gọn hơn thì tách `chore(ex2): scaffold project` riêng (phụ, ngoài 3 commit của thầy). Commit WBS cập nhật (`docs(ex2): ...`) đi trước C4.

## 6. Cổng Checkpoint 2 (phút 120)

- React DevTools Profiler: gõ 1 ký tự vào ô tìm → đúng **1** render pass của `ScientistDirectory`.
- Xoá "Johann Goethe": các item còn lại giữ key; focus chuyển sang dòng kế (hoặc ô tìm kiếm nếu hết).
- Accessibility: 100% control có label; `grep -n useEffect src/components/ScientistDirectory.jsx` = 0.
- Gate cấm như Ex1: `<div`, `http://`, `alert(`, `key={i}`, `style={{`.

## 7. Dễ sai (AI hay sinh)

- Hai `useState` + `useEffect` đồng bộ filtered (anti-pattern số 1); `sort()` mutate; `e.target.value` làm `minIq` thành chuỗi.
- Chỉ `toLowerCase()` mà không bỏ dấu; quên `đ` (không phân rã bằng NFD); chuẩn hóa query nhưng không chuẩn hóa dữ liệu (hoặc ngược lại).
- Tính `foldText` cho 7 bản ghi **mỗi lần render** thay vì một lần ở dữ liệu.
- Reset chỉ khôi phục `people`; input không nhãn; `key={p.name}`; card dùng ảnh mặc định cho mọi người.

## 8. Hiệu năng và bộ nhớ (đo trước, tối ưu sau)

- Giữ pipeline dẫn xuất trong render; với 7 bản ghi không `useMemo`. Chỉ thêm khi Profiler cho thấy lọc/sắp xếp đáng kể.
- Tách `PersonRow` nhận `person` và `onDelete`; chỉ `memo` + `useCallback` nếu Profiler cho thấy gõ phím làm render lại các dòng không đổi (ghi ảnh trước/sau vào `evidence/`). Nhớ rằng `metrics` là object tạo mới mỗi lần map nên sẽ vô hiệu `memo`: nếu cần thì tính sẵn `metrics` (đóng băng) cho từng người ở bước nạp dữ liệu.
- `handleDelete`/`handleReset` dùng cập nhật hàm `setPeople((prev) => ...)` để an toàn dưới StrictMode và nhấp nhanh.
- Reset dùng **snapshot module-level đóng băng** (`SMART_PEOPLE`), không clone mỗi lần render.
- Thử thách C (nâng `selectedId` lên `<App />`): `ScientistDirectory` nhận `selectedId` và `onSelect` qua props, không tự giữ state chọn. Thử thách A (watchlist): `watchlist` là mảng ID, thêm một điều kiện trong `selectVisible`, không thêm `useEffect`. Chỉ làm khi cần.
