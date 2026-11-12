import { describe, it, expect } from 'vitest';
import { MULTIPLIER, createSignal, effortReducer, impactOf, isRedFlag } from './effort.js';

describe('createSignal', () => {
  it('gắn multiplier theo actor', () => {
    expect(createSignal('s1', 'EM', 100)).toEqual({ id: 's1', actor: 'EM', steps: 100, multiplier: MULTIPLIER.EM });
    expect(createSignal('s2', 'AI_DO', 1).multiplier).toBe(50);
  });
});

describe('effortReducer', () => {
  it('ADD trả mảng mới, không mutate mảng gốc đã freeze', () => {
    const log = Object.freeze([createSignal('a', 'EM', 1)]);
    const next = effortReducer(log, { type: 'ADD', signal: createSignal('b', 'AI_DO', 1) });
    expect(next).not.toBe(log);
    expect(log).toHaveLength(1);
    expect(next.map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('CLEAR trả mảng rỗng', () => {
    expect(effortReducer([createSignal('a', 'EM', 1)], { type: 'CLEAR' })).toEqual([]);
  });

  it('action lạ giữ nguyên log', () => {
    const log = [createSignal('a', 'EM', 1)];
    expect(effortReducer(log, { type: 'NOPE' })).toBe(log);
  });
});

describe('impactOf', () => {
  it('EM 100 lần x 0.1 = 10; AI_DO 1 lần x 50 = 50', () => {
    const log = [createSignal('a', 'EM', 100), createSignal('b', 'AI_DO', 1)];
    expect(impactOf(log, 'EM')).toBeCloseTo(10);
    expect(impactOf(log, 'AI_DO')).toBe(50);
  });

  it('cộng dồn nhiều tín hiệu cùng actor; log rỗng = 0', () => {
    const log = [createSignal('a', 'EM', 100), createSignal('b', 'EM', 100)];
    expect(impactOf(log, 'EM')).toBeCloseTo(20);
    expect(impactOf([], 'EM')).toBe(0);
  });
});

describe('isRedFlag', () => {
  it('chỉ true ở DATING_NO_LOVE khi em < rival', () => {
    expect(isRedFlag('DATING_NO_LOVE', 10, 50)).toBe(true);
    expect(isRedFlag('DATING_NO_LOVE', 50, 50)).toBe(false);
    expect(isRedFlag('DATING_NO_LOVE', 60, 50)).toBe(false);
  });

  it('các pha khác không có cờ đỏ dù em < rival', () => {
    for (const phase of ['FRIENDS', 'OFFICIAL_LOVE', 'GHOSTED_EXIT']) {
      expect(isRedFlag(phase, 10, 50)).toBe(false);
    }
  });
});
