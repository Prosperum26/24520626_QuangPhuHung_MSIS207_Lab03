/**
 * @typedef {{ id: string, name: string, map: string, phase: string, alive: number,
 *   kills: number, wwcdProb: string, status: string }} Squad
 */

// wwcdProb giữ nguyên chuỗi như đề ('68%'); đóng băng để so sánh tham chiếu ổn định.
/** @type {readonly Squad[]} */
export const PUBG_VN_SQUADS = Object.freeze(
  [
    { id: 'ces', name: 'Cerberus Esports', map: 'Erangel', phase: 'Phase 6', alive: 4, kills: 14, wwcdProb: '68%', status: 'In Safe Zone' },
    { id: 'te', name: 'The Expendables', map: 'Miramar', phase: 'Phase 7', alive: 4, kills: 18, wwcdProb: '82%', status: 'Holding High Ground' },
    { id: 'ge', name: 'Genius Esports', map: 'Taego', phase: 'Phase 5', alive: 3, kills: 9, wwcdProb: '41%', status: 'Rotating Blue Zone' },
  ].map(Object.freeze),
);

export const SQUADS_BY_ID = new Map(PUBG_VN_SQUADS.map((squad) => [squad.id, squad]));
