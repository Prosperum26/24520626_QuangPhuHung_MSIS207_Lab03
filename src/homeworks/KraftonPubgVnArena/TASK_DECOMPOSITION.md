# TASK_DECOMPOSITION — Homework 3: KRAFTON x PUBG Vietnam Arena

> WBS con của [TASK_DECOMPOSITION.md](../../../TASK_DECOMPOSITION.md). Mỗi prompt AI = đúng một task ID. Nối tiếp HW3 Lab 2 (flash-sale, timer không trôi, `C:\Dev\Project\24520626_QuangPhuHung_MSIS207_Lab02\Homework3_Lab02`).
> **Mỗi bài là một project Vite độc lập** (có `package.json`, `node_modules/` riêng). Chạy mọi lệnh `npm` ngay trong folder này; đường dẫn file bên dưới tính từ folder này.
> **Nguyên tắc ưu tiên (đã chốt):** khi slide và WBS cũ lệch nhau thì **theo slide**. Phần WBS cũ không mâu thuẫn slide được giữ lại; phần mâu thuẫn chuyển xuống §6 làm nâng cấp tuỳ chọn.

## 1. Mục tiêu và phạm vi

"PVS Finals Ticket & G-Coin Contraband Crate Arena": đếm ngược airdrop không trôi, giữ hàng lạc quan với rollback khi 409, bảng xếp hạng đội có lọc/sắp xếp, và `AI_FAILURE_AUDIT.md` (>= 3 lỗi AI).

**Ba yêu cầu của slide:**
1. **Zero-drift airdrop hook:** đổi `Date.now()` delta timer của Lab 2 thành `usePubgAirdropTimer(targetEpochMs, serverOffsetMs = 0)`, có resync `visibilitychange` để tab nền không bao giờ trôi.
2. **Optimistic claim và 409 rollback:** claim vé PVS Grand Finals VIP (giá VND) và G-Coin Crate, trừ kho lạc quan, tự rollback khi server trả 409 "Looted Out", khoá `claimId` đang bay chống bấm đúp.
3. **Leaderboard "Kill-Feed Filter":** lọc và sắp xếp đội theo WWCD, Placement Points, Kill Points. **Đã chốt phương án A:** "Kill-Feed Filter" = lọc đội + sắp xếp theo `killPts`, không thêm danh sách sự kiện kill.

**Ràng buộc cứng (theo slide):**
- Hook đúng công thức slide: `Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs))`, tính lại bằng `setInterval` **200ms** và **ngay khi** `visibilitychange` sang `visible`; cleanup `clearInterval` và `removeEventListener`; effect phụ thuộc `[targetEpochMs, serverOffsetMs]`; trả về `{ remainingMs, isLive: remainingMs === 0 }`.
- Giá tiền VND bằng `Intl.NumberFormat('vi-VN', ...)` (`style: 'currency', currency: 'VND'`).
- Claim: khoá chống bấm đúp bằng `claimId` đang bay; trừ kho lạc quan; **rollback** khi 409.
- Bảng xếp hạng: lọc/sắp xếp bằng state dẫn xuất (0 `useEffect`).

**Ngoài phạm vi:** thanh toán thật, đăng nhập, WebSocket, danh sách sự kiện kill.

## 2. Contract (theo `pubg-vn-arena-contract.ts` của slide)

```ts
export type DropPhase = 'WARMUP' | 'AIRDROP_LIVE' | 'LOOTED_OUT' | 'EXPIRED';

export interface PubgCrateDrop {
  readonly id: string;
  readonly title: string;          // vd 'PVS Finals VIP Pass + 5,000 G-Coin'
  readonly priceVnd: number;       // định dạng bằng Intl.NumberFormat('vi-VN')
  readonly remainingStock: number;
  readonly dropEpochMs: number;
}

export interface PubgVnSquadStanding {
  readonly squadId: string;        // 'te' | 'ces' | 'ge' | 'agg'
  readonly squadName: string;
  readonly wwcdCount: number;      // Winner Winner Chicken Dinner
  readonly placementPts: number;
  readonly killPts: number;
}
```

Dự án dùng JSX/JS nên contract viết bằng JSDoc `@typedef` trong `src/domain/`, giữ nguyên tên trường như trên.

- **Squad (4 đội theo slide):** The Expendables = `te`, Cerberus Esports = `ces`, Roy Esports = `ge`, AGG = `agg`. Slide chỉ liệt kê 4 id nhưng chữ ghi "Roy Esports"; ánh xạ Roy = `ge` theo thứ tự là **giả định**, cần xác nhận với đề.
- **Phase** là hàm thuần của (`remainingMs`, `remainingStock`, mốc hết hạn): `WARMUP` trước giờ drop, `AIRDROP_LIVE` khi tới giờ và còn hàng, `LOOTED_OUT` khi hết hàng, `EXPIRED` sau thời hạn. Slide chỉ có `isLive: remainingMs === 0` nên **phase là phần mở rộng**: `isLive` của hook chỉ nói đã tới giờ, còn kho do `getDropPhase` quyết. Quy tắc nằm một chỗ.
- **API giả `reserveCrate`:** có latency, trả 200 hoặc 409; kho "thật" nằm phía server giả; tiêm được rng/latency và cờ "rival lấy suất cuối" để test tất định; tôn trọng `AbortSignal`.
- **Cấu hình:** dữ liệu mẫu và thời điểm drop đặt một chỗ, có `serverOffsetMs` để mô phỏng lệch đồng hồ.
- **Hook timer (đúng slide):** `useState(calcRemaining)`; trong effect gọi `syncClock()` ngay, `window.setInterval(syncClock, 200)`, `visibilitychange` gọi `syncClock` khi `document.visibilityState === 'visible'`.
- **Claim:** khoá `inFlightClaimId` trong `useRef` (không cần render); state chỉ cho `stock` và `error`; rollback theo `claimId`, trả lại đúng phần đã trừ, không ghi đè trạng thái mới hơn.

## 3. Task

| ID | Task | File | Gate | Trạng thái |
|---|---|---|---|---|
| H3-00 | Khởi tạo project Vite riêng: sao chép `package.json` (đổi `name`), `vite.config.js`, `eslint.config.js`, `index.html`, `src/main.jsx`, `src/test/setup.js` từ Ex1, rồi `npm install` | `package.json`, `vite.config.js`, `eslint.config.js`, `index.html`, `src/main.jsx`, `src/test/setup.js` | `npm test` và `npm run lint` chạy được | [x] |
| H3-01 | Contract (JSDoc), dữ liệu mẫu 4 đội + crate, `formatVnd`, `getDropPhase` | `src/domain/*.js` | Test: định dạng VND; ma trận phase | [x] |
| H3-02 | `usePubgAirdropTimer` đúng slide (`Date.now() + serverOffsetMs`, interval 200ms, `visibilitychange` resync, trả `{ remainingMs, isLive }`) | `src/hooks/usePubgAirdropTimer.js` | Test fake timers: tab nền 1 phút, khi `visible` giá trị đúng ngay; đổi `targetEpochMs` thì tính lại | [x] |
| H3-03 | Cleanup interval/listener, an toàn StrictMode | `src/hooks/usePubgAirdropTimer.js` | Test: unmount gỡ cả interval và listener | [x] |
| H3-04 | API giả `reserveCrate` 200/409 | `src/api/arena.js` | Test: 409 theo cấu hình/rival; abort được | [x] |
| H3-05 | Hook/reducer claim lạc quan + khoá `claimId` chống bấm đúp | `src/hooks/useCrateClaim.js` | Test: hai click liên tiếp chỉ một request | [x] |
| H3-06 | Rollback khi 409, hiển thị thông báo bằng chữ | `src/hooks/useCrateClaim.js` | Test: stock trở lại giá trị cũ, `role="alert"` | [x] |
| H3-07 | UI crate/vé: đếm ngược, giá VND, nút Claim theo phase | `src/components/CrateCard.jsx` | Nút `disabled` khi không hợp lệ + lý do bằng chữ | [x] |
| H3-08 | Bảng xếp hạng + lọc đội + sắp xếp WWCD/Placement/Kill (dẫn xuất) | `src/components/Leaderboard.jsx` | Test: sắp xếp bất biến (`.toSorted`); 0 `useEffect` cho lọc/sắp xếp | [x] |
| H3-09 | CSS Modules, 375px, reduced-motion, a11y | `src/**/*.module.css` | 0 cuộn ngang; Lighthouse a11y 100 | [x] |
| H3-10 | Đo drift (tab nền) và chụp bằng chứng | `evidence/` | JSON/ảnh đo drift, ảnh 409 rollback | [ ] |
| H3-11 | `AI_FAILURE_AUDIT.md` hoàn thiện từ lỗi thật | [../../../AI_FAILURE_AUDIT.md](../../../AI_FAILURE_AUDIT.md) | >= 3 lỗi có DevTools proof và bản sửa | [ ] |

## 4. Commit gợi ý

`docs(hw3): add arena spec` · `feat(hw3): usePubgAirdropTimer with visibility resync` · `feat(hw3): optimistic claim with 409 rollback` · `feat(hw3): leaderboard filter and sort` · `style(hw3): vnd formatting, a11y and 375px` · `docs(hw3): add AI failure evidence`

## 5. Cổng kiểm tra

- Mở tab khác 60-120 giây rồi quay lại: đồng hồ đúng ngay, không chậm hàng phút.
- Kho còn 1, hai người cùng bấm: một thành công, một rollback kèm thông báo chữ.
- Bấm đúp nhanh: chỉ một request đi.

## 6. Khác biệt so với WBS cũ và nâng cấp tuỳ chọn

Đã chuyển từ **bắt buộc** sang **tuỳ chọn** vì mâu thuẫn hoặc vượt slide. Chỉ làm khi H3-02 đã xanh và bạn giải thích được:

| Mục WBS cũ | Slide | Quyết định |
|---|---|---|
| Neo đồng hồ `performance.now()` thay `Date.now()` | Slide dùng `Date.now() + serverOffsetMs` | Theo slide. Hạn chế: người dùng đổi giờ hệ thống thì đồng hồ nhảy. Ghi nhận trong audit/README. |
| `now()` tiêm được vào hook | Slide không có | Test dùng `vi.useFakeTimers()` và `vi.setSystemTime()` thay vì tiêm. |
| Một interval dùng chung cho mọi card | Slide: mỗi hook một interval | Theo slide. Chỉ có ít card nên chi phí nhỏ. |
| Chỉ `setState` khi số giây đổi | Slide: `setRemainingMs` mỗi 200ms | Theo slide. Tối ưu sau nếu Profiler cho thấy render thừa. |
| Phase gồm 4 giá trị | Slide có `DropPhase` 4 giá trị nhưng `isLive` chỉ theo thời gian | Giữ `getDropPhase` thuần, `isLive` của hook không đổi. |

## 7. Dễ sai (nguồn ghi vào audit)

- `setSeconds(s => s - 1)` trong `setInterval` (drift).
- `useEffect(..., [])` giữ closure cũ; không cleanup khi đổi mục tiêu.
- Quên rollback hoặc rollback ghi đè trạng thái mới hơn (dùng cập nhật theo claim, không theo snapshot cũ).
- Quên gỡ listener `visibilitychange`, hoặc không `syncClock()` ngay khi mount nên hiển thị 0 một nhịp.
