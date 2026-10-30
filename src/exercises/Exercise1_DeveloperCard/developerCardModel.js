// Logic thuần của DeveloperCard. Không đụng DOM/React để test nhanh và sửa ở một chỗ.

/**
 * @typedef {{ id: string, name: string, tier: string }} Skill
 * @typedef {Readonly<Record<string, string | number>>} Metrics
 */

export const DEFAULT_FULL_NAME = 'Quang Phú Hưng';
export const DEFAULT_ROLE = 'Web Developer, UIT';

// Default là hằng module đóng băng: cùng tham chiếu mọi render (không cấp phát lại,
// không làm vô hiệu React.memo) và không ai mutate dùng chung được.
/** @type {Metrics} */
export const DEFAULT_METRICS = Object.freeze({ commits: 512, vdomNodes: 0, a11yScore: 100 });

/** @type {readonly Skill[]} */
export const DEFAULT_SKILLS = Object.freeze([
  Object.freeze({ id: 'sk-1', name: 'React 19 Fiber', tier: 'Core' }),
]);

const METRIC_LABELS = Object.freeze({
  commits: 'Commits',
  vdomNodes: 'VDOM nodes',
  a11yScore: 'A11y score',
});

// Tạo Intl.NumberFormat tốn kém: chỉ tạo một lần ở module.
const numberFormatter = new Intl.NumberFormat('vi-VN');

/**
 * Chữ cái đầu của từ đầu và từ cuối ('Quang Phú Hưng' -> 'QH', 'Plato' -> 'P').
 * Dùng code point nên không cắt đôi ký tự có dấu; rỗng thì trả '?'.
 * @param {string} [name]
 * @returns {string}
 */
export function getInitials(name = '') {
  const words = String(name ?? '').trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return '?';
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : '';
  return (first + last).toLocaleUpperCase('vi-VN');
}

/**
 * Nhãn hiển thị cho khóa metric: ưu tiên bảng nhãn, còn lại tách camelCase.
 * @param {string} key
 * @returns {string}
 */
export function formatMetricLabel(key) {
  if (Object.hasOwn(METRIC_LABELS, key)) return METRIC_LABELS[key];
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/gu, '$1 $2')
    .replace(/[_-]+/gu, ' ')
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * @param {string | number} value
 * @returns {string}
 */
export function formatMetricValue(value) {
  return typeof value === 'number' ? numberFormatter.format(value) : String(value);
}

/**
 * Chỉ nhận https hoặc cùng origin (đường dẫn tương đối của app). Chặn http://,
 * javascript:, data: và URL không phân tích được.
 * @param {unknown} url
 * @param {string} [origin]
 * @returns {boolean}
 */
export function isSafeAvatarUrl(url, origin = globalThis.location?.origin ?? 'https://localhost') {
  if (typeof url !== 'string' || url.trim() === '') return false;
  try {
    const parsed = new URL(url, origin);
    return parsed.protocol === 'https:' || parsed.origin === origin;
  } catch {
    return false;
  }
}
