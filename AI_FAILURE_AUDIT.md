# AI Failure Mode Audit — Lab 03

> Deliverable bắt buộc (15% điểm, cùng nhóm với Atomic Git): ghi lại **ít nhất 3 lỗi AI thật** đã gặp khi làm Lab 3, kèm bằng chứng DevTools và bản sửa thủ công.
> File này là **khung trống**. Chỉ điền điều đã xảy ra trong session. Không bịa prompt, đoạn code, ảnh DevTools hay commit hash; AI chỉ được chỉnh câu chữ và định dạng.

- **Sinh viên:** Quang Phú Hùng — 24520626
- **Môn:** MSIS207 — Lab 03
- **Công cụ AI:** _(điền)_
- **Prompt log liên quan:** _(link tới `docs/prompt_logs/...`)_

## Tổng quan

| # | Bài | Lỗi | Loại bằng chứng | Trạng thái |
|---|---|---|---|---|
| 1 | _(Ex/HW)_ | _(tóm tắt một dòng)_ | _(Profiler / Network / Console / Accessibility tree)_ | Chưa điền |
| 2 | | | | Chưa điền |
| 3 | | | | Chưa điền |

## Gợi ý nhóm lỗi hay gặp (chỉ để nhận diện, không chép)

| Nhóm | Dấu hiệu | Cách chứng minh |
|---|---|---|
| `useEffect` dư cho state dẫn xuất | Hai `useState` + effect đồng bộ danh sách lọc | Profiler: 1 ký tự = 2 render |
| Stale closure | `setInterval(..., [])` giữ `squadId` cũ | Network: vẫn gọi squad cũ sau khi đổi |
| Thiếu cleanup / abort | Request hoặc oscillator còn chạy sau unmount | Network `(canceled)` không xuất hiện; còn tiếng |
| Timer trôi | `setSeconds(s => s - 1)` khi tab nền | Bảng đo drift ở `evidence/` |
| Lỗi ngữ nghĩa | `<div>` thay thẻ ngữ nghĩa, input không label | Accessibility tree, Lighthouse |
| API cũ | class, `defaultProps`, `keyCode`, `alert()` | `grep`, Console |

## Mẫu cho mỗi lỗi (sao chép khi điền)

### Lỗi N — _(tên ngắn)_

#### Bối cảnh

- **Task:** _(ID trong WBS, ví dụ E3-04)_
- **Prompt gốc:** _(trích đúng từ prompt log)_
- **Điều AI tuyên bố:** _(ví dụ "test pass nên đúng")_

#### Lỗi

_(mô tả lỗi và đoạn code AI sinh ra, trong khối code có ngôn ngữ)_

```jsx
// code AI sinh ra
```

#### Bằng chứng

_(output thật hoặc ảnh, kèm alt cụ thể)_

![Mô tả cụ thể nội dung ảnh DevTools](exercises/Exercise3_PubgTelemetry/evidence/ten-anh.png)

#### Bản sửa thủ công

- **Commit:** _(hash thật từ `git log`)_
- **Thay đổi:** _(diff ngắn và lý do)_

#### Bài học

_(một hai câu: lần sau kiểm tra gì trước khi tin AI)_
