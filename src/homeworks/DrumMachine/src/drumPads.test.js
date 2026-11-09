import { describe, it, expect } from 'vitest';
import { PADS, padMap, ACTIVE_MS, LOG_MAX } from './drumPads.js';

describe('drumPads', () => {
  it('có đúng 7 pad', () => {
    expect(PADS).toHaveLength(7);
  });

  it('e.code duy nhất và đúng bảng W A S D J K L', () => {
    const codes = PADS.map((p) => p.code);
    expect(new Set(codes).size).toBe(7);
    expect([...codes].sort()).toEqual(['KeyA', 'KeyD', 'KeyJ', 'KeyK', 'KeyL', 'KeyS', 'KeyW']);
  });

  it('id duy nhất', () => {
    expect(new Set(PADS.map((p) => p.id)).size).toBe(7);
  });

  it('padMap tra theo e.code ra đúng pad', () => {
    expect(padMap.size).toBe(7);
    expect(padMap.get('KeyW').id).toBe('openhat');
    expect(padMap.get('KeyA').id).toBe('kick');
    expect(padMap.get('KeyW')).toBe(PADS.find((p) => p.code === 'KeyW'));
  });

  it('padMap không nhận e.key (chữ thường) để tránh lỗi UniKey', () => {
    expect(padMap.has('w')).toBe(false);
  });

  it('hi-hat đóng và mở cùng chokeGroup', () => {
    expect(padMap.get('KeyD').chokeGroup).toBe('hat');
    expect(padMap.get('KeyW').chokeGroup).toBe('hat');
  });

  it('hằng số là số dương', () => {
    expect(ACTIVE_MS).toBeGreaterThan(0);
    expect(LOG_MAX).toBeGreaterThan(0);
  });
});
