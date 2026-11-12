// Một formatter dùng lại, theo yêu cầu slide: Intl.NumberFormat('vi-VN', currency VND).
const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

/** @param {number} amount */
export function formatVnd(amount) {
  return vndFormatter.format(amount);
}
