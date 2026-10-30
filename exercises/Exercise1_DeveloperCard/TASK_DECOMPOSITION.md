# TASK_DECOMPOSITION — Exercise 1: DeveloperCard (Sprint 1, 35 phút)

> WBS con của [TASK_DECOMPOSITION.md](../../TASK_DECOMPOSITION.md). Mỗi prompt AI = đúng một task ID. AI không commit; chỉ đề xuất, bạn tự commit. Bối cảnh: [Context.md](../../docs/Context.md).
> Ưu tiên của bài này (đã chốt): **chạy đúng, nhanh, state và memory đúng** trước, dễ bảo vệ sau. Các quyết định ở §3 đều xuất phát từ một lỗi cụ thể.

## 1. Mục tiêu và phạm vi

Xây `<DeveloperCard />` và `<SkillBadge />` bằng React 19, gộp ý từ Elon Musk Card (Ex 4.4) và User Profile (Ex 4.5) của deck cũ.

**Ràng buộc cứng (từ đề):** 0 thẻ `<div>` trong `DeveloperCard.jsx`; 0 `http://`; CSS Modules, không inline `style`; ảnh có `width`/`height` (CLS = 0) và fallback chữ cái đầu; 375px không cuộn ngang.
**Ngoài phạm vi:** fetch, routing, state quản lý toàn cục. (Nâng `selectedId` lên `<App />` là thử thách C, làm sau khi có Ex2.)

## 2. File sẽ tạo

| File | Vai trò |
|---|---|
| `src/components/developerCardModel.js` | Toàn bộ logic thuần và hằng: `DEFAULT_*`, `getInitials`, `formatMetricLabel`, `isSafeAvatarUrl`, `metricFormatter` |
| `src/components/SkillBadge.jsx` | `<li>` một kỹ năng |
| `src/components/DeveloperCard.jsx` | Component bắt buộc theo checklist slide; **không `<div>`** |
| `src/components/DeveloperCard.module.css` | Bố cục, responsive |
| `src/styles/tokens.css` | Token `:root` dùng chung cả lab (màu, khoảng cách) |
| `src/assets/avatar-128.webp` | Avatar local (chuẩn bị ở X0-08) |
| `src/App.jsx`, `src/main.jsx` | Khung demo; `main.jsx` đã có từ X0-05 |
| `src/components/*.test.jsx`, `developerCardModel.test.js` | Test |

Logic thuần nằm ở `developerCardModel.js` để test nhanh và sửa một chỗ; component chỉ ghép.

## 3. Quyết định thiết kế và lý do

| # | Quyết định | Lỗi/vấn đề nó tránh |
|---|---|---|
| D1 | Fallback avatar lưu **`failedUrl`** (chuỗi) thay vì boolean: `showImage = isSafeAvatarUrl(avatarUrl) && failedUrl !== avatarUrl` | Boolean `imgFailed` bị "dính": đổi `avatarUrl` (thử thách C) mà card vẫn hiện initials. `failedUrl` tự hết lỗi khi URL đổi, **không cần `useEffect`** |
| D2 | `DEFAULT_METRICS`, `DEFAULT_SKILLS` là hằng module, `Object.freeze` (sâu), dùng làm default parameter | Default literal trong tham số tạo object mới mỗi render: tốn cấp phát, làm `React.memo` vô hiệu, dễ bị mutate dùng chung |
| D3 | Avatar mặc định là **file local** 128×128 (hiển thị 64×64 cho màn 2x), `width`/`height` cố định, `decoding="async"`, **không** `loading="lazy"` (ảnh trên màn hình đầu) | Ảnh ngoài thêm round-trip và lỗi mạng; CLS; lazy làm chậm ảnh LCP |
| D4 | `alt=""` cho avatar (trang trí), initials `aria-hidden`; tên người đã nằm ở `<h2>` | Screen reader đọc trùng tên |
| D5 | `isSafeAvatarUrl`: chỉ `https:` hoặc cùng origin; còn lại hiện initials | `http://` (Mixed Content), `javascript:` / `data:` bất ngờ |
| D6 | `id` heading từ `useId()` | Hardcode `dev-heading` trùng id khi có nhiều card |
| D7 | Nhãn `dt` qua `formatMetricLabel` (bảng nhãn + fallback tách camelCase) | `vdomNodes`, `a11yScore` in thô khó đọc |
| D8 | `Intl.NumberFormat` tạo **một lần** ở module | Tạo formatter mỗi render rất tốn |
| D9 | Tier kỹ năng hiển thị **bằng chữ** `(Core)`, không chỉ màu | WCAG 1.4.1 |
| D10 | `React.memo` **chỉ khi Profiler chứng minh cần** (E1-10) | Không tối ưu sớm; D2 làm cho `memo` có hiệu lực khi cần |
| D11 | Default `fullName`/`role` là dữ liệu của chính bạn, không phải tên giảng viên trong slide | Slide dạy cú pháp, không dạy nội dung (sửa nếu muốn) |

## 4. Contract

```js
/**
 * @typedef {{ id: string, name: string, tier: string }} Skill
 * @typedef {Readonly<Record<string, string|number>>} Metrics
 * @typedef {Object} DeveloperCardProps
 * @property {string}   [fullName]
 * @property {string}   [role]
 * @property {string}   [avatarUrl]  // https hoặc cùng origin; sai -> initials
 * @property {Metrics}  [metrics=DEFAULT_METRICS]
 * @property {readonly Skill[]} [skills=DEFAULT_SKILLS]
 */
```

```js
// developerCardModel.js (mọi hàm thuần, không đụng DOM)
getInitials(name)            // 'Quang Phú Hưng' -> 'QH'; 'Plato' -> 'P'; '  ' -> '?'; dùng code point, không cắt dấu
formatMetricLabel(key)       // bảng nhãn; fallback tách camelCase: 'someKey' -> 'Some key'
isSafeAvatarUrl(url)         // new URL(url, location.origin): protocol 'https:' hoặc cùng origin
metricFormatter              // new Intl.NumberFormat('vi-VN') tạo một lần
```

Cây DOM đích:

```text
article[aria-labelledby=headingId]
  header
    img[alt="" width=64 height=64]  |  span[aria-hidden] initials
    hgroup > h2#headingId + p
  dl > (Fragment key=metricKey) dt + dd ...
  ul[aria-label="Engineered Skills"] > SkillBadge(li, key=skill.id) ...
```

## 5. Task (thứ tự làm, mỗi dòng một prompt)

Thời lượng là ngân sách trong Block 2; X0-08 (avatar) làm ở Block 1.

| ID | Task | File | Gate | Phút | Trạng thái |
|---|---|---|---|---|---|
| E1-01 | Model thuần + test: defaults đóng băng, `getInitials`, `formatMetricLabel`, `isSafeAvatarUrl`, `metricFormatter` | `developerCardModel.js` (+ test) | Test: dấu tiếng Việt, 1 từ, rỗng, `http://`, `javascript:`, cùng origin, frozen | 4 | [ ] |
| E1-02 | `SkillBadge({ name, tier = 'Core' })` trả `<li>`, tier bằng chữ | `SkillBadge.jsx` (+ test) | Test: tên + `(tier)` trong text | 2 | [ ] |
| E1-03 | Khung `DeveloperCard`: `article`/`header`/`hgroup`, `useId`, default params dùng hằng D2 | `DeveloperCard.jsx` | `getByRole('article', { name })`, heading level 2 | 4 | [ ] |
| E1-04 | `dl` metrics: `Object.entries`, `<Fragment key>` | `DeveloperCard.jsx` | Test: số `dt` = số `dd` = số khóa; nhãn đã format | 3 | [ ] |
| E1-05 | `ul` skills, key `skill.id` | `DeveloperCard.jsx` | Test: `listitem` đủ; không warning key | 2 | [ ] |
| E1-06 | Avatar: `failedUrl`, `isSafeAvatarUrl`, `onError`, initials | `DeveloperCard.jsx` | Test tự hồi (D1) và URL không an toàn | 5 | [ ] |
| E1-07 | Khung demo `App.jsx`: `<main><h1>` + các ca (mặc định, tên rất dài, ảnh lỗi, 2 card) | `App.jsx` | Chạy dev server, Console sạch dưới StrictMode | 2 | [ ] |
| E1-08 | `tokens.css` + `DeveloperCard.module.css` (bố cục, token, tương phản) | `.css` | Không hex ngoài `:root`; không inline `style` | 7 | [ ] |
| E1-09 | Responsive 375 → 1440px, `overflow-wrap`, `min-width: 0` | `.module.css` | Device Toolbar iPhone SE: 0 cuộn ngang | 3 | [ ] |
| E1-10 | Verify: lint, grep, a11y tree, Lighthouse, Profiler quyết định `memo` | `evidence/` | Xem §7 | 3 | [ ] |

### Test cần có (chỉ những cái bắt được lỗi thật)

| Test | Bắt lỗi nào |
|---|---|
| Fallback tự hồi: `fireEvent.error(img)` → hiện initials; `rerender` URL mới → ảnh quay lại; `rerender` URL lỗi cũ → vẫn initials | D1 (state dính) |
| URL `http://…` và `javascript:…` → không có `<img>` | D5 |
| `Object.isFrozen(DEFAULT_METRICS)` và sâu; hai lần render dùng cùng tham chiếu | D2 |
| `container.querySelectorAll('div').length === 0` (bao gồm cả con của `SkillBadge`) | Zero div thật sự, không chỉ `grep` |
| `fullName = '<img src=x onerror=alert(1)>'` → không có `img[src="x"]`, chuỗi hiện như text | XSS (nối tiếp Lab 2) |
| Render trong `<StrictMode>` với `console.error` được spy: không gọi | Key warning, lỗi hook |
| Hai card cùng lúc: `aria-labelledby` khác nhau và trỏ đúng heading | D6 |

## 6. Commit đề xuất (AI không commit)

| Commit | Message (nguyên văn đề) | Task |
|---|---|---|
| C2 | `feat(ex1): implement semantic DeveloperCard and SkillBadge` | E1-01 đến E1-07 |
| C3 | `style(ex1): add responsive 375px CSS module` | E1-08 đến E1-10 |
| (phụ, nếu cần) | `perf(ex1): memoize DeveloperCard` | chỉ khi E1-10 quyết định thêm `memo` |

Xem `git diff` trước khi commit; không commit `evidence/` nặng không cần thiết.

## 7. Cổng Checkpoint 1 (phút 75)

```bash
grep -n '<div' src/components/DeveloperCard.jsx      # 0 dòng
grep -n 'http://' src/components/DeveloperCard.jsx   # 0 dòng
grep -rnE 'style=\{\{|dangerouslySetInnerHTML|key=\{(i|idx|index)\}' src/components   # 0 dòng
npm test                                              # pass
npm run lint                                          # sạch (react-hooks, jsx-a11y)
```

DevTools:
- Elements → Accessibility: `article` có tên → `header` + `dl` + `list`.
- Device Toolbar iPhone SE (375px): 0 cuộn ngang; thử thêm ca tên rất dài.
- Console: không warning dưới StrictMode.
- Lighthouse Accessibility = 100 (lưu JSON/ảnh vào `evidence/`).
- **Quyết định `memo` (D10)**: tạm thêm một nút "re-render parent" (state không liên quan) vào `App.jsx`, ghi React Profiler. Nếu card render lại dù props bằng nhau, bọc `memo(function DeveloperCard…)`, đo lại, lưu hai ảnh (trước/sau), rồi **xoá nút tạm**. Nếu không render lại vì lý do khác, không thêm `memo`.

## 8. Dễ sai (AI hay sinh)

- `<div className={styles.header}>`; inline `style`; `key={i}`; ba `<h1>` cho metadata.
- Default literal trong tham số (`metrics = { … }`); boolean `imgFailed` thay `failedUrl`; `useEffect` để reset lỗi ảnh.
- `http://` hoặc ảnh Unsplash bắt buộc; thiếu `width/height`; `alt` trùng tên; `loading="lazy"` cho avatar.
- Tạo `Intl.NumberFormat` trong thân component.
- Ghi lỗi AI mắc phải vào ghi chú cho [AI_FAILURE_AUDIT.md](../../AI_FAILURE_AUDIT.md), kèm bằng chứng (Profiler, test fail).
