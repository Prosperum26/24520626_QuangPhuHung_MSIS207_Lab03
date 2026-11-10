# Font

`Bricolage Grotesque` (Mathieu Triay, giấy phép SIL Open Font License 1.1), bản variable trục độ đậm 400-800.
Hai tập con của Google Fonts đủ cho tiếng Việt: `latin` và `vietnamese`. Phục vụ từ cùng domain để trang
không phải đợi stylesheet và file font của bên thứ ba (Lighthouse: Render-blocking requests, Network dependency tree).
Khai báo `@font-face` ở `src/styles/tokens.css`; `index.html` preload hai file này.
