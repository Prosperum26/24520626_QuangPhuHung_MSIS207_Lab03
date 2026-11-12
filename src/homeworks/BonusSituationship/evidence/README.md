# Evidence — Bonus Situationship (B-05)

Tạo bằng `scripts/check-ui.mjs` (Edge thật + puppeteer-core + axe-core) và `scripts/check-contrast.mjs`.

| File | Nội dung |
|---|---|
| `check-ui.json` | 9 kiểm tra đều `ok: true`: không cuộn ngang 375px và 320px, axe-core 0 vi phạm ở 3 trạng thái, status hiện cờ đỏ, thứ tự Tab, timer 5s (đo thật ~5019ms) |
| `contrast.txt` | Tương phản các cặp màu thật (AA chữ 4.5:1, thành phần 3:1), tất cả đạt |
| `375px-*.png` | Ảnh toàn trang ở 375px: FRIENDS, cờ đỏ, GHOSTED_EXIT |
| `a11y-tree.json` | Accessibility tree sau khi bị bỏ rơi |

**Chưa chạy:** Lighthouse. Máy chưa cài; axe-core là engine mà audit a11y của Lighthouse dùng, nhưng điểm Lighthouse "100" chưa được đo, đừng ghi là đã đạt.
Cài công cụ kiểm: `npm i --no-save puppeteer-core axe-core` (không đổi package.json).
