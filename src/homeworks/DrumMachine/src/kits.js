/**
 * Danh sách kit. Mỗi kit là một thư mục `public/kits/<id>/` có đủ `<padId>.wav` cho mọi pad
 * trong drumPads.js, nên đổi kit không động tới phím hay hook bàn phím.
 * @typedef {{ id: string, label: string }} Kit
 */

/** @type {readonly Kit[]} */
export const KITS = Object.freeze([
  { id: 'acoustic', label: 'Acoustic' },
  { id: 'electronic', label: 'Electronic 808' },
]);

export const DEFAULT_KIT_ID = 'acoustic';

/**
 * Đường dẫn tương đối tới file âm; engine ghép với `import.meta.env.BASE_URL`.
 * @param {string} kitId
 * @param {string} padId
 */
export function kitUrl(kitId, padId) {
  if (!KITS.some((k) => k.id === kitId)) throw new Error(`Kit không tồn tại: ${kitId}`);
  return `kits/${kitId}/${padId}.wav`;
}
