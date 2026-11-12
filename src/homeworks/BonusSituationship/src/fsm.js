/**
 * @typedef {'FRIENDS'|'DATING_NO_LOVE'|'OFFICIAL_LOVE'|'GHOSTED_EXIT'} RelationshipPhase
 * @typedef {'ASK_OUT'|'COMMIT'|'GHOST'} RelationshipEvent
 */

// Slide có hai bộ tên mâu thuẫn; chốt bộ trong code mẫu (Context.md §9).
export const PHASES = Object.freeze(['FRIENDS', 'DATING_NO_LOVE', 'OFFICIAL_LOVE', 'GHOSTED_EXIT']);
export const EVENTS = Object.freeze(['ASK_OUT', 'COMMIT', 'GHOST']);

// Bảng chuyển ở một chỗ duy nhất. Cặp không có trong bảng = giữ nguyên pha.
// GHOSTED_EXIT không có dòng nào nên là trạng thái cuối.
const TABLE = Object.freeze({
  FRIENDS: { ASK_OUT: 'DATING_NO_LOVE' },
  DATING_NO_LOVE: { COMMIT: 'OFFICIAL_LOVE', GHOST: 'GHOSTED_EXIT' },
  OFFICIAL_LOVE: { GHOST: 'GHOSTED_EXIT' },
});

/**
 * Hàm thuần, không throw.
 * @param {RelationshipPhase} phase
 * @param {RelationshipEvent} event
 * @returns {RelationshipPhase}
 */
export function transition(phase, event) {
  return TABLE[phase]?.[event] ?? phase;
}
