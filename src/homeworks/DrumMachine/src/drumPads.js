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
