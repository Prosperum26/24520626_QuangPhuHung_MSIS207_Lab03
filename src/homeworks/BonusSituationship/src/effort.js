/**
 * @typedef {'EM'|'AI_DO'} Actor
 * @typedef {{ id: string, actor: Actor, steps: number, multiplier: number }} EffortSignal
 */

// "Em cố trăm lần" (0.1/bước) so với "ai đó một phần" (50/bước).
export const MULTIPLIER = Object.freeze({ EM: 0.1, AI_DO: 50 });

/** @returns {EffortSignal} */
export function createSignal(id, actor, steps) {
  return { id, actor, steps, multiplier: MULTIPLIER[actor] };
}

/**
 * Reducer nhật ký tín hiệu, bất biến: luôn trả mảng mới.
 * @param {readonly EffortSignal[]} log
 * @param {{ type: 'ADD', signal: EffortSignal } | { type: 'CLEAR' }} action
 */
export function effortReducer(log, action) {
  switch (action.type) {
    case 'ADD':
      return [...log, action.signal];
    case 'CLEAR':
      return [];
    default:
      return log;
  }
}

/** Tổng impact (steps * multiplier) của một actor; tính dẫn xuất, không lưu vào state. */
export function impactOf(log, actor) {
  return log.reduce((sum, s) => (s.actor === actor ? sum + s.steps * s.multiplier : sum), 0);
}

/** Cờ đỏ: đang hẹn hò nhưng nỗ lực của em thua ai đó. */
export function isRedFlag(phase, emImpact, rivalImpact) {
  return phase === 'DATING_NO_LOVE' && emImpact < rivalImpact;
}
