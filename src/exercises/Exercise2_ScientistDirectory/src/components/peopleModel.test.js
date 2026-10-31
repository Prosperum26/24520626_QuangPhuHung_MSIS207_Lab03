import { describe, expect, it } from 'vitest';
import { SMART_PEOPLE } from '../data/smartPeople.js';
import { foldText, matchesQuery, selectVisible, tokenize } from './peopleModel.js';

const names = (list) => list.map((p) => p.name);
const all = { query: '', minIq: 0, sortBy: 'iq-desc' };

describe('foldText', () => {
  it.each([
    ['Hưng', 'hung'],
    ['HƯNG', 'hung'],
    ['hung', 'hung'],
    ['Đặng Thị Ánh', 'dang thi anh'],
    ['đ', 'd'],
    ['Đ', 'd'],
    ['Quảng Phú Hưng', 'quang phu hung'],
    ['Einstein', 'einstein'],
  ])('%j -> %j', (input, expected) => {
    expect(foldText(input)).toBe(expected);
  });

  it('không lỗi với undefined/null/số', () => {
    expect(foldText(undefined)).toBe('');
    expect(foldText(null)).toBe('');
    expect(foldText(42)).toBe('42');
  });

  it('giống nhau với dạng dựng sẵn và dạng tổ hợp (NFC/NFD)', () => {
    expect(foldText('Hưng'.normalize('NFC'))).toBe(foldText('Hưng'.normalize('NFD')));
  });
});

describe('tokenize', () => {
  it('rỗng hoặc chỉ khoảng trắng -> không token', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   ')).toEqual([]);
  });

  it('tách theo khoảng trắng và chuẩn hóa', () => {
    expect(tokenize('  Quảng   HƯNG ')).toEqual(['quang', 'hung']);
  });
});

describe('matchesQuery', () => {
  const me = SMART_PEOPLE.find((p) => p.id === 'sp-7');
  it('không token thì khớp mọi người', () => {
    expect(matchesQuery(me, [])).toBe(true);
  });
  it('mọi token phải khớp (AND), thứ tự tùy ý', () => {
    expect(matchesQuery(me, ['hung', 'quang'])).toBe(true);
    expect(matchesQuery(me, ['hung', 'einstein'])).toBe(false);
  });
});

describe('selectVisible: tìm kiếm', () => {
  const find = (query) => names(selectVisible(SMART_PEOPLE, { ...all, query }));

  it.each([
    ['ein', ['Albert Einstein']],
    ['  EIN ', ['Albert Einstein']],
    ['vin', ['Leonardo da Vinci']],
    ['hung', ['Quảng Phú Hưng']],
    ['HƯNG', ['Quảng Phú Hưng']],
    ['Hưng', ['Quảng Phú Hưng']],
    ['phu hung', ['Quảng Phú Hưng']],
    ['hưng phú', ['Quảng Phú Hưng']],
    ['zzz', []],
  ])('%j', (query, expected) => {
    expect(find(query)).toEqual(expected);
  });

  it('query rỗng trả đủ 7 người', () => {
    expect(find('')).toHaveLength(7);
    expect(find('   ')).toHaveLength(7);
  });

  it('khớp chuỗi con giữa từ (aac -> Isaac)', () => {
    expect(find('aac')).toEqual(['Isaac Newton']);
  });
});

describe('selectVisible: lọc IQ và sắp xếp', () => {
  it('lọc iq >= minIq (biên bao gồm)', () => {
    const result = selectVisible(SMART_PEOPLE, { ...all, minIq: 205 });
    expect(names(result)).toEqual(['Johann Goethe', 'Albert Einstein']);
  });

  it('iq-desc: giảm dần, trùng iq thì theo tên', () => {
    const result = selectVisible(SMART_PEOPLE, { ...all, minIq: 190 });
    expect(names(result)).toEqual([
      'Johann Goethe',
      'Albert Einstein',
      'William Sidis',
      'Isaac Newton',
      'James Maxwell',
    ]);
  });

  it('age-asc: tuổi tăng dần', () => {
    const result = selectVisible(SMART_PEOPLE, { ...all, sortBy: 'age-asc' });
    expect(result.map((p) => p.age)).toEqual([...result.map((p) => p.age)].sort((a, b) => a - b));
    expect(result[0].name).toBe('Quảng Phú Hưng');
  });

  it('không mutate mảng gốc (toSorted) và trả mảng mới', () => {
    const copy = [...SMART_PEOPLE];
    const result = selectVisible(SMART_PEOPLE, { ...all, sortBy: 'age-asc' });
    expect(SMART_PEOPLE).toEqual(copy);
    expect(result).not.toBe(SMART_PEOPLE);
  });

  it('kết hợp query + minIq', () => {
    expect(names(selectVisible(SMART_PEOPLE, { query: 'a', minIq: 200, sortBy: 'iq-desc' }))).toEqual([
      'Johann Goethe',
      'Albert Einstein',
      'William Sidis',
    ]);
  });
});
