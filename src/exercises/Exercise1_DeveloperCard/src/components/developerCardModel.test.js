import { describe, expect, it } from 'vitest';
import {
  DEFAULT_METRICS,
  DEFAULT_SKILLS,
  formatMetricLabel,
  formatMetricValue,
  getInitials,
  isSafeAvatarUrl,
} from './developerCardModel.js';

describe('defaults', () => {
  it('được đóng băng (sâu)', () => {
    expect(Object.isFrozen(DEFAULT_METRICS)).toBe(true);
    expect(Object.isFrozen(DEFAULT_SKILLS)).toBe(true);
    expect(DEFAULT_SKILLS.every((skill) => Object.isFrozen(skill))).toBe(true);
  });

  it('mutate bị từ chối (strict mode ném lỗi)', () => {
    expect(() => {
      DEFAULT_METRICS.commits = 0;
    }).toThrow(TypeError);
  });

  it('mỗi skill có id duy nhất', () => {
    const ids = DEFAULT_SKILLS.map((skill) => skill.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getInitials', () => {
  it.each([
    ['Quang Phú Hưng', 'QH'],
    ['  quang   phú  hưng  ', 'QH'],
    ['Plato', 'P'],
    ['Đặng Thị Ánh', 'ĐÁ'],
    ['', '?'],
    ['   ', '?'],
  ])('%j -> %j', (input, expected) => {
    expect(getInitials(input)).toBe(expected);
  });

  it('không lỗi với undefined/null', () => {
    expect(getInitials(undefined)).toBe('?');
    expect(getInitials(null)).toBe('?');
  });

  it('không cắt đôi ký tự ngoài BMP', () => {
    expect(getInitials('😀 Smile')).toBe('😀S');
  });
});

describe('formatMetricLabel', () => {
  it('dùng bảng nhãn cho khóa đã biết', () => {
    expect(formatMetricLabel('vdomNodes')).toBe('VDOM nodes');
    expect(formatMetricLabel('a11yScore')).toBe('A11y score');
  });

  it('tách camelCase/snake_case cho khóa lạ', () => {
    expect(formatMetricLabel('someKey')).toBe('Some key');
    expect(formatMetricLabel('open_issues')).toBe('Open issues');
  });

  it('không nhầm khóa kế thừa từ Object.prototype', () => {
    expect(formatMetricLabel('constructor')).toBe('Constructor');
  });
});

describe('formatMetricValue', () => {
  it('định dạng số theo vi-VN', () => {
    expect(formatMetricValue(512)).toBe('512');
    expect(formatMetricValue(1234567)).toBe('1.234.567');
  });

  it('giữ nguyên chuỗi', () => {
    expect(formatMetricValue('n/a')).toBe('n/a');
  });
});

describe('isSafeAvatarUrl', () => {
  const origin = 'http://localhost:5173';

  it.each([
    ['https://example.com/a.png', true],
    ['/assets/avatar.jpg', true],
    ['avatar.jpg', true],
    ['http://localhost:5173/a.png', true],
    ['http://example.com/a.png', false],
    ['javascript:pwned()', false],
    ['data:image/png;base64,AAAA', false],
    ['//evil.example/a.png', false],
    ['', false],
    ['   ', false],
  ])('%j -> %j', (url, expected) => {
    expect(isSafeAvatarUrl(url, origin)).toBe(expected);
  });

  it('không phải chuỗi thì false', () => {
    expect(isSafeAvatarUrl(undefined, origin)).toBe(false);
    expect(isSafeAvatarUrl(42, origin)).toBe(false);
  });
});
