# TASK_DECOMPOSITION — Homework 3: KRAFTON x PUBG Vietnam Arena

> WBS con của [TASK_DECOMPOSITION.md](../../../TASK_DECOMPOSITION.md). Mỗi prompt AI = đúng một task ID. Nối tiếp HW3 Lab 2 (flash-sale, timer không trôi, `C:\Dev\Project\24520626_QuangPhuHung_MSIS207_Lab02\Homework3_Lab02`).

## 1. Mục tiêu và phạm vi

"PVS Finals Ticket & G-Coin Contraband Crate Arena": đếm ngược airdrop không trôi, giữ hàng lạc quan với rollback khi 409, bảng xếp hạng đội có lọc/sắp xếp, và `AI_FAILURE_AUDIT.md` (>= 3 lỗi AI).

**Ràng buộc cứng:**
- `usePubgAirdropTimer(targetEpochMs, serverOffsetMs = 0)`: `Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs))`, tính lại mỗi 200ms **và** ngay khi `visibilitychange` sang `visible`; cleanup interval và listener.
- Giá tiền VND bằng `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.
- Claim: khoá chống bấm đúp bằng `claimId` đang bay; trừ kho lạc quan; **rollback** khi server trả 409 "Looted Out".
- Bảng xếp hạng: lọc/sắp xếp theo WWCD, Placement Points, Kill Points bằng state dẫn xuất (0 effect).
**Ngoài phạm vi:** thanh toán thật, đăng nhập, WebSocket.

## 2. Contract

```ts
type DropPhase = 'WARMUP' | 'AIRDROP_LIVE' | 'LOOTED_OUT' | 'EXPIRED';
interface PubgCrateDrop { readonly id: string; readonly title: string; readonly priceVnd: number; readonly remainingStock: number; readonly dropEpochMs: number }
interface PubgVnSquadStanding { readonly squadId: string; readonly squadName: string; readonly wwcdCount: number; readonly placementPts: number; readonly killPts: number }
// squadId: 'te' | 'ces' | 'ge' | 'agg' (+ id cho Roy Esports nếu dùng, vd 'roy')
```

- Phase là hàm thuần của (`remainingMs`, `stock`): `WARMUP` trước giờ drop, `AIRDROP_LIVE` khi tới giờ và còn hàng, `LOOTED_OUT` khi hết hàng, `EXPIRED` sau thời hạn. Quy tắc nằm một chỗ.
- API giả (`reserveCrate`): có latency, trả 200 hoặc 409; tiêm được rng/latency để test tất định; tôn trọng `AbortSignal`.
- Dữ liệu mẫu và thời điểm drop đặt trong module cấu hình (một chỗ), có `serverOffsetMs` để mô phỏng lệch đồng hồ.
- **Đồng hồ đơn điệu (đã chốt)**: khi khởi tạo lấy `anchor = { wall: Date.now() + serverOffsetMs, perf: performance.now() }`; thời gian hiện tại = `anchor.wall + (performance.now() - anchor.perf)`; còn lại = `Math.max(0, targetEpochMs - now)`. Đổi giờ hệ thống không làm nhảy. Hàm `now()` tiêm được vào hook để test tất định. Tính lại `anchor` khi `visibilitychange` sang `visible` hoặc `serverOffsetMs` đổi.
- **Một nhịp chung**: một interval dùng chung cho mọi card đếm ngược thay vì mỗi card một interval; cleanup khi không còn ai đăng ký.
- **Cập nhật tối thiểu**: chỉ `setState` khi giá trị hiển thị (giây) đổi, tránh render 5 lần/giây.
- **Claim**: khoá `inFlightClaimId` trong `useRef` (không cần render); state chỉ cho `stock` và `error`; rollback theo `claimId`, không ghi đè trạng thái mới hơn.

## 3. Task

| ID | Task | File | Gate | Trạng thái |
|---|---|---|---|---|
| H3-01 | Spec, kiểu dữ liệu, dữ liệu mẫu, `formatVnd`, `getDropPhase` | `domain/*.js` | Test: định dạng VND; ma trận phase | [ ] |
| H3-02 | `usePubgAirdropTimer` (200ms + `visibilitychange`, đồng hồ neo `performance.now()`, `now()` tiêm được) | `hooks/usePubgAirdropTimer.js` | Test với fake timers: sau 1 phút nền, khi `visible` giá trị đúng ngay | [ ] |
| H3-03 | Cleanup interval/listener, an toàn StrictMode | `usePubgAirdropTimer.js` | Test: unmount gỡ cả hai | [ ] |
| H3-04 | API giả `reserveCrate` 200/409 | `api/arena.js` | Test: 409 theo cấu hình; abort được | [ ] |
| H3-05 | Hook/reducer claim lạc quan + khoá `claimId` chống bấm đúp | `hooks/useCrateClaim.js` | Test: hai click liên tiếp chỉ một request | [ ] |
| H3-06 | Rollback khi 409, hiển thị thông báo bằng chữ | `useCrateClaim.js` | Test: stock trở lại giá trị cũ, `role="alert"` | [ ] |
| H3-07 | UI crate/vé: đếm ngược, giá VND, nút Claim theo phase | `components/CrateCard.jsx` | Nút `disabled` khi không hợp lệ + lý do bằng chữ | [ ] |
| H3-08 | Bảng xếp hạng + lọc đội + sắp xếp (dẫn xuất) | `components/Leaderboard.jsx` | Test: sắp xếp bất biến; 0 `useEffect` cho lọc/sắp xếp | [ ] |
| H3-09 | CSS Modules, 375px, reduced-motion, a11y | `*.module.css` | 0 cuộn ngang; Lighthouse a11y 100 | [ ] |
| H3-10 | Đo drift (tab nền) và chụp bằng chứng | `evidence/` | JSON/ảnh đo drift, ảnh 409 rollback | [ ] |
| H3-11 | `AI_FAILURE_AUDIT.md` hoàn thiện từ lỗi thật | [../../../AI_FAILURE_AUDIT.md](../../../AI_FAILURE_AUDIT.md) | >= 3 lỗi có DevTools proof và bản sửa | [ ] |

## 4. Commit gợi ý

`docs(hw3): add arena spec` · `feat(hw3): usePubgAirdropTimer with visibility resync` · `feat(hw3): optimistic claim with 409 rollback` · `feat(hw3): leaderboard filter and sort` · `style(hw3): vnd formatting, a11y and 375px` · `docs(hw3): add AI failure evidence`

## 5. Cổng kiểm tra

- Mở tab khác 60-120 giây rồi quay lại: đồng hồ đúng ngay, không chậm hàng phút.
- Kho còn 1, hai người cùng bấm: một thành công, một rollback kèm thông báo chữ.
- Bấm đúp nhanh: chỉ một request đi.

## 6. Dễ sai (nguồn ghi vào audit)

- `setSeconds(s => s - 1)` trong `setInterval` (drift).
- `useEffect(..., [])` giữ closure cũ; không cleanup khi đổi mục tiêu.
- Quên rollback hoặc rollback ghi đè trạng thái mới hơn (dùng cập nhật theo claim, không theo snapshot cũ).
