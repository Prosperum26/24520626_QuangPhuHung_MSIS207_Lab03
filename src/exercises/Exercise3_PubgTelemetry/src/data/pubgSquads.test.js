import { describe, expect, it } from 'vitest';
import { PUBG_VN_SQUADS, SQUADS_BY_ID } from './pubgSquads.js';
import { DEFAULT_SQUAD_ID } from '../config/telemetry.js';

const FIELDS = ['id', 'name', 'map', 'phase', 'alive', 'kills', 'wwcdProb', 'status'];

describe('PUBG_VN_SQUADS (E3-01)', () => {
  it('có đúng 3 squad CES, TE, GE theo thứ tự đề', () => {
    expect(PUBG_VN_SQUADS.map((s) => s.id)).toEqual(['ces', 'te', 'ge']);
  });

  it('mỗi squad đủ trường, đúng kiểu', () => {
    for (const squad of PUBG_VN_SQUADS) {
      expect(Object.keys(squad).toSorted()).toEqual(FIELDS.toSorted());
      expect(typeof squad.alive).toBe('number');
      expect(typeof squad.kills).toBe('number');
      expect(squad.wwcdProb).toMatch(/^\d+%$/);
    }
  });

  it('dữ liệu khớp đề (The Expendables: Miramar, Phase 7, 4 sống, 18 kill, 82%)', () => {
    expect(SQUADS_BY_ID.get('te')).toMatchObject({
      name: 'The Expendables',
      map: 'Miramar',
      phase: 'Phase 7',
      alive: 4,
      kills: 18,
      wwcdProb: '82%',
    });
  });

  it('id không trùng và bị đóng băng', () => {
    expect(new Set(PUBG_VN_SQUADS.map((s) => s.id)).size).toBe(3);
    expect(Object.isFrozen(PUBG_VN_SQUADS)).toBe(true);
    expect(PUBG_VN_SQUADS.every(Object.isFrozen)).toBe(true);
  });

  it('squad mặc định tồn tại trong dữ liệu', () => {
    expect(SQUADS_BY_ID.has(DEFAULT_SQUAD_ID)).toBe(true);
  });
});
