/** Thời hạn mở airdrop sau giờ drop (30 phút). */
export const DROP_WINDOW_MS = 30 * 60 * 1000;

/**
 * Đã quá thời hạn mở airdrop chưa. `remainingMs` của hook bị chặn ở 0 nên
 * không biết đã quá bao lâu; phần này tính từ `nowMs` và `dropEpochMs`.
 * @param {number} dropEpochMs
 * @param {number} nowMs
 * @param {number} [windowMs]
 */
export function isDropExpired(dropEpochMs, nowMs, windowMs = DROP_WINDOW_MS) {
  return nowMs >= dropEpochMs + windowMs;
}

/**
 * Quy tắc phase nằm đúng một chỗ này. Thứ tự ưu tiên:
 * trước giờ drop = WARMUP; sau thời hạn = EXPIRED; hết hàng = LOOTED_OUT; còn lại = AIRDROP_LIVE.
 * @param {{ remainingMs: number, remainingStock: number, isExpired?: boolean }} input
 * @returns {import('./contract.js').DropPhase}
 */
export function getDropPhase({ remainingMs, remainingStock, isExpired = false }) {
  if (remainingMs > 0) return 'WARMUP';
  if (isExpired) return 'EXPIRED';
  if (remainingStock <= 0) return 'LOOTED_OUT';
  return 'AIRDROP_LIVE';
}
