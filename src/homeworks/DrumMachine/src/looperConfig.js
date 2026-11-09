/** Hằng số looper, một chỗ để sửa nhanh khi bị đột biến. */

/** Looper kiểm tra "có hit nào sắp tới không" mỗi TICK_MS... */
export const TICK_MS = 25;
/** ...và đặt lịch trước LOOKAHEAD_MS. Phải lớn hơn TICK_MS nhiều để lỡ nhịp một tick vẫn không trễ tiếng. */
export const LOOKAHEAD_MS = 100;
/** Vòng ghi ngắn hơn mức này (hoặc không có hit) bị bỏ. */
export const MIN_LOOP_MS = 300;

/** Tốc độ phát lại: hệ số co giãn thời gian, không đổi cao độ. */
export const SPEED_MIN = 0.5;
export const SPEED_MAX = 2;
export const SPEED_STEP = 0.25;
export const SPEED_DEFAULT = 1;

/** Chế độ phát: lặp liên tục hoặc phát một vòng rồi chờ bấm Play. */
export const LOOP_MODES = Object.freeze([
  { id: 'loop', label: 'Lặp liên tục' },
  { id: 'once', label: 'Một lần' },
]);
export const DEFAULT_LOOP_MODE = 'loop';
