/**
 * Một nguồn duy nhất cho phím <-> pad <-> âm. Sửa phím khi bị đột biến chỉ cần đổi `code` ở đây.
 * @typedef {{ id: string, code: string, label: string, chokeGroup?: string }} Pad
 *   code: giá trị e.code (vị trí phím vật lý), không phụ thuộc bộ gõ như UniKey.
 *   chokeGroup: pad cùng nhóm cắt tiếng nhau (hi-hat đóng cắt hi-hat mở).
 */

/** Thời gian pad sáng (aria-pressed=true) sau mỗi hit. */
export const ACTIVE_MS = 120;

/** Số hit tối đa giữ trong lịch sử hit log. */
export const LOG_MAX = 8;

/** Gộp các hit trong khoảng này thành một câu đọc, để trình đọc màn hình không đọc từng phím. */
export const ANNOUNCE_MS = 500;

/** Meter: cập nhật số tối đa ~12 lần/giây (đủ mượt, không render mỗi frame). */
export const METER_INTERVAL_MS = 80;
/** Số vạch của thanh meter. */
export const METER_SEGMENTS = 12;
/** Ngưỡng chữ của meter (dB, từ cao xuống thấp). Dưới ngưỡng cuối là "Im lặng". */
export const METER_LEVELS = Object.freeze([
  { minDb: -12, label: 'Rất lớn' },
  { minDb: -24, label: 'Lớn' },
  { minDb: -40, label: 'Vừa' },
  { minDb: -59, label: 'Nhỏ' },
]);

/** @type {readonly Pad[]} */
export const PADS = Object.freeze([
  { id: 'openhat', code: 'KeyW', label: 'Open Hat', chokeGroup: 'hat' },
  { id: 'kick', code: 'KeyA', label: 'Kick' },
  { id: 'snare', code: 'KeyS', label: 'Snare' },
  { id: 'hihat', code: 'KeyD', label: 'Hi-Hat', chokeGroup: 'hat' },
  { id: 'tom', code: 'KeyJ', label: 'Tom' },
  { id: 'clap', code: 'KeyK', label: 'Clap' },
  { id: 'crash', code: 'KeyL', label: 'Crash' },
]);

/** @type {ReadonlyMap<string, Pad>} khoá là e.code, ví dụ 'KeyW'. */
export const padMap = new Map(PADS.map((pad) => [pad.code, pad]));

/** @type {ReadonlyMap<string, Pad>} khoá là pad.id, ví dụ 'kick'. */
export const padById = new Map(PADS.map((pad) => [pad.id, pad]));

/** Chữ in trên phím: 'KeyW' -> 'W'. */
export const keyLabel = (pad) => pad.code.replace(/^Key/, '');
