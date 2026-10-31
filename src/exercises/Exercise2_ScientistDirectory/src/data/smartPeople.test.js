import { describe, expect, it } from 'vitest';
import rawPeople from './people.json';
import { SMART_PEOPLE } from './smartPeople.js';

describe('SMART_PEOPLE (E2-01)', () => {
  it('có đủ 6 người của thầy và người thứ 7 là bạn', () => {
    expect(SMART_PEOPLE).toHaveLength(7);
    expect(SMART_PEOPLE.slice(0, 6).map((p) => p.id)).toEqual(['sp-1', 'sp-2', 'sp-3', 'sp-4', 'sp-5', 'sp-6']);
  });

  it('id duy nhất và có tiền tố sp-', () => {
    const ids = SMART_PEOPLE.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^sp-\d+$/.test(id))).toBe(true);
  });

  it('tên không rỗng, age và iq là số hữu hạn dương', () => {
    for (const p of SMART_PEOPLE) {
      expect(p.name.trim()).not.toBe('');
      expect(Number.isFinite(p.age) && p.age > 0).toBe(true);
      expect(Number.isFinite(p.iq) && p.iq > 0).toBe(true);
    }
  });

  it('không còn chỗ TODO chưa nhập trong people.json', () => {
    expect(JSON.stringify(rawPeople)).not.toMatch(/todo/i);
  });

  it('đóng băng cả mảng lẫn từng bản ghi', () => {
    expect(Object.isFrozen(SMART_PEOPLE)).toBe(true);
    expect(SMART_PEOPLE.every((p) => Object.isFrozen(p))).toBe(true);
  });

  it('searchKey đã chuẩn hóa: chữ thường, không dấu', () => {
    const me = SMART_PEOPLE.find((p) => p.id === 'sp-7');
    expect(me.searchKey).toBe('quang phu hung');
    expect(SMART_PEOPLE.find((p) => p.id === 'sp-3').searchKey).toBe('leonardo da vinci');
  });
});
