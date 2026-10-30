# TASK_DECOMPOSITION — Exercise 1: DeveloperCard (Sprint 1, 35 phút)

> WBS con của [TASK_DECOMPOSITION.md](../../TASK_DECOMPOSITION.md). Mỗi prompt AI = đúng một task ID. Bối cảnh: [Context.md](../../docs/Context.md).

## 1. Mục tiêu và phạm vi

Xây `<DeveloperCard />` và `<SkillBadge />` bằng React 19, gộp ý từ Elon Musk Card (Ex 4.4) và User Profile (Ex 4.5) của deck cũ.

**Ràng buộc cứng:** 0 thẻ `<div>` trong `DeveloperCard.jsx`; 0 `http://`; CSS Modules, không inline `style`; ảnh có `width`/`height` (CLS = 0) và fallback chữ cái đầu; 375px không cuộn ngang.
**Ngoài phạm vi:** state, fetch, routing.

## 2. Contract (chốt trước khi prompt)

```js
/**
 * @typedef {{ id: string, name: string, tier: string }} Skill
 * @typedef {Record<string, string|number>} Metrics
 * @typedef {Object} DeveloperCardProps
 * @property {string} [fullName='Tran Vinh Khiem']
 * @property {string} [role='Senior Systems Architect UIT S3T']
 * @property {string} [avatarUrl]   // chỉ https
 * @property {Metrics} [metrics={ commits: 512, vdomNodes: 0, a11yScore: 100 }]
 * @property {Skill[]} [skills=[{ id: 'sk-1', name: 'React 19 Fiber', tier: 'Core' }]]
 */
```

- Cấu trúc: `article[aria-labelledby]` → `header` (`img` + `hgroup` → `h2#id` + `p`) → `dl` (Fragment key = tên metric) → `ul[aria-label]` (`SkillBadge` key = `skill.id`).
- `id` của heading dùng `useId()`, không hardcode `dev-heading` nếu card có thể xuất hiện nhiều lần (Challenge C).
- Fallback ảnh: lỗi tải hoặc thiếu `avatarUrl` thì hiện chữ cái đầu của `fullName` (`aria-hidden`, tên đã có ở `h2`).

## 3. Task

| ID | Task (một prompt) | File | Gate | Trạng thái |
|---|---|---|---|---|
| E1-01 | Viết typedef/props contract (§2) | `src/components/DeveloperCard.jsx` (JSDoc) | Contract khớp §2 | [ ] |
| E1-02 | `SkillBadge({ name, tier })` trả `<li>`, default tier | `src/components/SkillBadge.jsx` | Test: render tên + tier | [ ] |
| E1-03 | `DeveloperCard` khung `article`/`header`/`hgroup` với default parameters | `DeveloperCard.jsx` | Accessibility tree: `article` có tên | [ ] |
| E1-04 | Metrics bằng `Object.entries` → `<Fragment key><dt/><dd/></Fragment>` | `DeveloperCard.jsx` | Test: số `dt` = số `dd` = số khóa | [ ] |
| E1-05 | Danh sách kỹ năng map `SkillBadge` key `skill.id` | `DeveloperCard.jsx` | Không warning key; `grep '<div'` = 0 | [ ] |
| E1-06 | Ảnh: https, `width`/`height`, `alt`, fallback chữ cái đầu | `DeveloperCard.jsx` | Test: lỗi ảnh → hiện initials; `grep 'http://'` = 0 | [ ] |
| E1-07 | `DeveloperCard.module.css`: token, bố cục, `:focus-visible` | `DeveloperCard.module.css` | Không hex ngoài `:root`; không inline style | [ ] |
| E1-08 | Responsive 375px → 1440px | `DeveloperCard.module.css` | Device Toolbar iPhone SE: 0 cuộn ngang | [ ] |
| E1-09 | Kiểm DevTools + Lighthouse, lưu bằng chứng | `evidence/` | Accessibility tree: article → header + dl + list; a11y 100 | [ ] |

## 4. Commit

| Commit | Message (nguyên văn đề) | Task |
|---|---|---|
| C2 | `feat(ex1): implement semantic DeveloperCard and SkillBadge` | E1-01 đến E1-06 |
| C3 | `style(ex1): add responsive 375px CSS module` | E1-07 đến E1-09 |

## 5. Cổng Checkpoint 1 (phút 75)

```bash
grep -n '<div' src/components/DeveloperCard.jsx     # 0 dòng
grep -n 'http://' src/components/DeveloperCard.jsx  # 0 dòng
git log --oneline                                    # 2 commit ex1 khớp bảng §4
```

DevTools: Elements → Accessibility; Device Toolbar iPhone SE (375px) không cuộn ngang; Console sạch.

## 6. Dễ sai (AI hay sinh)

- `<div className={styles.header}>` thay cho `<header>`; inline `style={{...}}`; `key={i}`; ba `<h1>` cho metadata.
- Ảnh `http://`, thiếu `width/height`; `alt` trùng tên đứng cạnh `h2`.
- Ghi lại lỗi nào AI mắc vào ghi chú cho [AI_FAILURE_AUDIT.md](../../AI_FAILURE_AUDIT.md).
