# TASK_DECOMPOSITION — Exercise 2: ScientistDirectory (Sprint 2, 45 phút)

> WBS con của [TASK_DECOMPOSITION.md](../../../TASK_DECOMPOSITION.md). Mỗi prompt AI = đúng một task ID.

## 1. Mục tiêu và phạm vi

Biến mảng `smartPeople` tĩnh thành trình khám phá dữ liệu: 1) tìm tên không phân biệt hoa thường, 2) lọc IQ tối thiểu (`valueAsNumber`), 3) sắp xếp IQ/tuổi bằng `.toSorted()`, 4) xoá và đặt lại.

**Ràng buộc cứng:** **0 `useEffect`** cho lọc/sắp xếp; mọi input có `<label htmlFor>` + `useId()`; số kết quả trong `<output role="status" aria-live="polite">`; key là `id`.
**Ngoài phạm vi:** lưu localStorage, phân trang, gọi API.

## 2. Contract

```js
/** @typedef {{ id: string, name: string, age: number, iq: number }} Person */
/** @typedef {'iq-desc' | 'age-asc'} SortKey */
/**
 * @typedef {Object} ScientistDirectoryProps
 * @property {Person[]} [initialData=SMART_PEOPLE]
 */
```

- State độc lập (và chỉ những cái này): `people`, `query`, `minIq`, `sortBy`. `visible` là biến tính trong render.
- Dữ liệu mẫu: `sp-1` Goethe 82/210, `sp-2` Einstein 76/205, `sp-3` da Vinci 67/180, `sp-4` Newton 84/190, `sp-5` Maxwell 48/190, `sp-6` Sidis 46/200.
- `handleDelete(id)`: `setPeople((prev) => prev.filter((p) => p.id !== id))`. `handleReset`: khôi phục **cả bốn state** về mặc định (`people` từ snapshot `initialData`, `query=''`, `minIq=160`, `sortBy='iq-desc'`).
- Sắp xếp phụ khi trùng điểm (ví dụ `localeCompare` theo tên) để thứ tự ổn định.
- Thiết kế chừa chỗ cho thử thách A (watchlist): lọc là chuỗi điều kiện trong một biểu thức, thêm điều kiện không cần effect.

## 3. Task

| ID | Task | File | Gate | Trạng thái |
|---|---|---|---|---|
| E2-01 | Hằng `SMART_PEOPLE` với `id` ổn định (sửa dữ liệu mẫu nếu cần) | `data/smartPeople.js` | Test: id duy nhất, đủ trường | [ ] |
| E2-02 | Khung `ScientistDirectory` + render `<ul>` key `p.id` | `ScientistDirectory.jsx` | Không warning key | [ ] |
| E2-03 | Ô tìm tên: `useId`, `<label htmlFor>`, lọc không phân biệt hoa thường, trim | `ScientistDirectory.jsx` | Test: "ein" ra Einstein; "  EIN " cũng ra | [ ] |
| E2-04 | Ô Min IQ: `type=number`, `valueAsNumber`, `Number.isNaN` → 0 | `ScientistDirectory.jsx` | Test: gõ rỗng không `NaN`; `minIq` luôn là number | [ ] |
| E2-05 | Sắp xếp `<select>` có label; `.toSorted()` | `ScientistDirectory.jsx` | Test: mảng `people` gốc không đổi thứ tự | [ ] |
| E2-06 | Kiểm render: 1 ký tự gõ = đúng 1 render pass | Profiler | Ảnh Profiler trong `evidence/`; grep `useEffect` = 0 | [ ] |
| E2-07 | Nút xoá từng người (tên truy cập có tên người), xoá bất biến | `ScientistDirectory.jsx` | Test: xoá giữa danh sách, key còn lại giữ nguyên | [ ] |
| E2-08 | Nút Reset khôi phục toàn bộ | `ScientistDirectory.jsx` | Test: sau reset mọi điều khiển về mặc định | [ ] |
| E2-09 | `<output role="status" aria-live="polite">` "Found N pioneers" + trạng thái rỗng | `ScientistDirectory.jsx` | Test: N khớp; rỗng có thông báo chữ | [ ] |
| E2-10 | CSS Modules + 375px + Lighthouse | `ScientistDirectory.module.css`, `evidence/` | 0 cuộn ngang; a11y 100; focus giữ khi xoá | [ ] |

## 4. Commit

| Commit | Message (nguyên văn đề) | Task |
|---|---|---|
| C4 | `feat(ex2): normalize smartPeople schema with stable IDs` | E2-01, E2-02 |
| C5 | `feat(ex2): add search, IQ filter & toSorted` | E2-03 đến E2-06 |
| C6 | `feat(ex2): add delete/reset & live status` | E2-07 đến E2-10 |

## 5. Cổng Checkpoint 2 (phút 120)

- React DevTools Profiler: gõ 1 ký tự vào ô tìm → đúng **1** render pass.
- Xoá "Johann Goethe": các item còn lại giữ key, focus không nhảy về `<body>` một cách vô lý (xác định chỗ focus sau xoá và ghi vào code review).
- Accessibility: 100% control có label; `grep -n useEffect src/exercises/Exercise2_ScientistDirectory/ScientistDirectory.jsx` = 0.

## 6. Dễ sai

- Hai `useState` + `useEffect` đồng bộ filtered (anti-pattern số 1); `sort()` mutate; `e.target.value` làm `minIq` thành chuỗi.
- Reset chỉ khôi phục `people`; input không nhãn; `key={p.name}`.
- Ghi vào ghi chú audit nếu AI mắc, kèm ảnh Profiler.

## 7. Hiệu năng và bộ nhớ (đo trước, tối ưu sau)

- **Giữ nguyên** pipeline dẫn xuất trong render; với 6 bản ghi không cần `useMemo`. Nếu dữ liệu lớn, chỉ thêm `useMemo` khi Profiler cho thấy lọc/sắp xếp đáng kể.
- Tách `PersonRow` nhận `person` và `onDelete`. Chỉ bọc `memo` + `useCallback` nếu Profiler cho thấy gõ phím làm render lại các dòng không đổi; ghi ảnh trước/sau vào `evidence/`.
- `handleDelete`/`handleReset` dùng cập nhật hàm `setPeople((prev) => ...)` để an toàn dưới StrictMode và nhấp nhanh.
- Reset dùng **snapshot module-level đóng băng** (`SMART_PEOPLE`), không clone mỗi lần render.
- Focus sau khi xoá: chuyển focus có chủ đích (dòng kế tiếp hoặc ô tìm kiếm) bằng `ref`, không để rơi về `<body>`.
- Khi nâng `selectedId` lên `<App />` (thử thách C): `ScientistDirectory` nhận `selectedId` và `onSelect` qua props, không tự giữ state chọn.
- Watchlist (thử thách A): `watchlist` là mảng ID, lọc thêm một điều kiện trong pipeline dẫn xuất, không thêm `useEffect`. Chỉ làm khi cần.
