import { describe, it, expect } from 'vitest';
import { formatVnd } from './formatVnd.js';
import { DROP_WINDOW_MS, getDropPhase, isDropExpired } from './dropPhase.js';
import { SQUADS, createSampleCrates } from './arenaConfig.js';

describe('formatVnd', () => {
  it('định dạng vi-VN với dấu chấm ngăn cách và ký hiệu ₫', () => {
    expect(formatVnd(350000).replace(/\s/g, ' ')).toBe('350.000 ₫');
    expect(formatVnd(1500000).replace(/\s/g, ' ')).toBe('1.500.000 ₫');
    expect(formatVnd(0).replace(/\s/g, ' ')).toBe('0 ₫');
  });
});

describe('getDropPhase', () => {
  const cases = [
    { remainingMs: 5000, remainingStock: 3, isExpired: false, expected: 'WARMUP' },
    { remainingMs: 5000, remainingStock: 0, isExpired: false, expected: 'WARMUP' },
    { remainingMs: 0, remainingStock: 3, isExpired: false, expected: 'AIRDROP_LIVE' },
    { remainingMs: 0, remainingStock: 0, isExpired: false, expected: 'LOOTED_OUT' },
    { remainingMs: 0, remainingStock: 3, isExpired: true, expected: 'EXPIRED' },
    { remainingMs: 0, remainingStock: 0, isExpired: true, expected: 'EXPIRED' },
  ];
  it.each(cases)('remaining=$remainingMs stock=$remainingStock expired=$isExpired -> $expected', ({ expected, ...input }) => {
    expect(getDropPhase(input)).toBe(expected);
  });

  it('isExpired mặc định là false', () => {
    expect(getDropPhase({ remainingMs: 0, remainingStock: 1 })).toBe('AIRDROP_LIVE');
  });
});

describe('isDropExpired', () => {
  it('chỉ hết hạn từ đúng mốc drop + cửa sổ', () => {
    expect(isDropExpired(1000, 1000 + DROP_WINDOW_MS - 1)).toBe(false);
    expect(isDropExpired(1000, 1000 + DROP_WINDOW_MS)).toBe(true);
  });
});

describe('arenaConfig', () => {
  it('có 4 đội theo slide với squadId duy nhất', () => {
    expect(SQUADS.map((s) => s.squadId)).toEqual(['te', 'ces', 'ge', 'agg']);
  });

  it('crate mẫu có giờ drop trong tương lai so với mốc truyền vào', () => {
    const crates = createSampleCrates(1_000_000);
    expect(crates.every((c) => c.dropEpochMs > 1_000_000)).toBe(true);
    expect(new Set(crates.map((c) => c.id)).size).toBe(crates.length);
  });
});
