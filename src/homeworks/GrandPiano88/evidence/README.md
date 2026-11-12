# Bằng chứng kiểm chứng HW2 (H2-07, H2-11, H2-12)

Tệp này ghi lại cái gì đã kiểm, kiểm bằng cách nào, và cái gì còn phải kiểm tay. Chỉ đánh dấu một mục khi đã có tệp bằng chứng thật trong thư mục này.

## Đã có

| Mục | Cách kiểm | Kết quả | Tệp |
|---|---|---|---|
| Tương phản màu (WCAG 1.4.3, 1.4.11) | `node scripts/check-contrast.mjs` đọc màu từ `src/styles/tokens.css` | 13/13 cặp đạt, thấp nhất 10,15:1 (viền mực trên phím đen đang nhấn) | [contrast.txt](contrast.txt) |
| Logic, `memo`, steal, ghi, phát lại | `npm test` (Vitest + jsdom) | 140 test pass | chạy lại lệnh để xem |
| Lighthouse trên bản build | DevTools > Lighthouse trên `http://localhost:4173/` (`npm run preview`), lúc 19:58:27 | Performance **100**, Accessibility **100**, Best Practices **100**, SEO 91 | [lighthouse-build.png](lighthouse-build.png) |
| React Profiler: một lần nhấn | React DevTools > Profiler, bật "Record why each component rendered", nhấn một phím; commit 1 trong 10 | `PianoKey (Memo)` có `key="45"` render lại, lý do **Props changed: isPressed**; cha render là `PianoStudio` và `GrandPiano` | [profiler-one-key.png](profiler-one-key.png) |
| Cây accessibility, phím đang nhấn | Console: pointerdown mô phỏng lên `[data-midi="61"]`, rồi Elements > Accessibility | Name "C thăng 4", Role button, `aria-pressed: true`, Pressed: true, Focusable: true | [a11y-tree-key-pressed.png](a11y-tree-key-pressed.png) |
| Steal FIFO trên UI | Console: pointerdown mô phỏng 9 phím (xem ghi chú bên dưới) | 8 phím sáng, phím nhấn sớm nhất (C thăng 4) đã tắt | [voice-steal.png](voice-steal.png) |
| Khung nhìn 393 px | DevTools > Device toolbar, preset iPhone, 393 x 852 | Phím đàn vừa khung, khung đàn có thanh cuộn riêng; panel Ghi/Phát xuống hàng (đã sửa, xem dưới) | [viewport-393px.png](viewport-393px.png) |

Ghi chú về các bằng chứng trên:

- **Ảnh a11y tree và steal dùng input mô phỏng** (`dispatchEvent` trong Console), không phải chuột thật, vì giữ nhiều phím cùng lúc bằng chuột hoặc giữ một phím trong lúc mở DevTools là không làm được.
- **Ảnh steal:** lệnh đầu của ảnh nhấn C thăng 4 (MIDI 61) từ bước a11y tree và chưa nhả. Vòng lặp sau đó nhấn MIDI 60 đến 68; MIDI 61 bị bỏ qua vì đang giữ, nên có 9 phím khác nhau và phím cũ nhất là **61** (không phải 60) bị cướp. Trong ảnh phím đen C thăng 4 không sáng, còn C4 sáng. Hành vi đúng FIFO.
- **Ảnh Profiler** chụp trước khi `Sequencer` được bọc `memo`; bản hiện tại không render `Sequencer` khi nhấn phím (có test). Ảnh chưa thấy rõ 87 phím còn lại là "Did not render". Nếu cần bằng chứng mạnh hơn, chụp lại ở chế độ **Ranked** (liệt kê đúng các component đã render trong commit đó).
- Test tự động cho cùng gate: `GrandPiano.test.jsx` đếm 88 lần render lúc mount và đúng 1 lần khi nhấn một phím.
- Console trong ảnh steal hiện "No issues", nhưng chưa phải ảnh kiểm Console cho cả luồng ghi/phát.

## Còn thiếu

| Mục | Cách làm | Tệp |
|---|---|---|
| File JSON của Lighthouse | DevTools > Lighthouse, menu ⋮ > Save as JSON, lưu `lighthouse-a11y.report.json` (gate H2-12 yêu cầu JSON; hiện mới có ảnh) | `lighthouse-a11y.report.json` |
| 375 px | Device toolbar > Responsive 375 x 812 (ảnh hiện có là 393 px, không phải 375 px). Kiểm trang không cuộn ngang, chỉ khung đàn cuộn | `375px.png` |
| Tab qua trang | Tab từ đầu: Ghi, các radio tốc độ, rồi **một** phím (C4) có khung focus đậm; mũi tên đổi phím; Space giữ phát tiếng | `tab-focus.png` |
| Ghi và phát lại bằng tay | Ghi vài nốt, phát ở 0,5x, 1x, 2x, Dừng giữa chừng; vùng status đọc đúng | `sequencer.png` |
| Giảm chuyển động (2.3.3) | Rendering > Emulate `prefers-reduced-motion: reduce`: phím vẫn lún khi nhấn | `reduced-motion.png` |
| Console cả luồng | Chơi phím, ghi, phát, dừng: không có lỗi hay cảnh báo | `console.png` |
| Nghe thử | Không pop khi nhấn/nhả nốt rất thấp (A0) và rất cao (C8); 9 phím không méo; phát lại nhịp đều, 2x đúng gấp đôi | ghi chú, không cần ảnh |
