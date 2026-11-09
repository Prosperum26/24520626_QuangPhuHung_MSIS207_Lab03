import { describe, it, expect } from 'vitest';
import { positionAt, toAudioTime, reanchor, eventsInWindow } from './loopScheduler.js';

const anchorAt = (audioTime, loopT, speed) => ({ audioTime, loopT, speed });

describe('positionAt / toAudioTime', () => {
  it.each([0.5, 1, 2])('speed %s: vị trí tăng theo speed', (speed) => {
    const anchor = anchorAt(10, 0, speed);
    expect(positionAt(anchor, 10)).toBe(0);
    expect(positionAt(anchor, 12)).toBeCloseTo(2 * speed);
  });

  it.each([0.5, 1, 2])('speed %s: toAudioTime là nghịch đảo của positionAt', (speed) => {
    const anchor = anchorAt(3, 1.5, speed);
    const audio = toAudioTime(anchor, 4);
    expect(positionAt(anchor, audio)).toBeCloseTo(4);
  });

  it('speed 2 phát nhanh gấp đôi: sự kiện ở loopT 1 rơi vào 0,5 giây sau mốc', () => {
    expect(toAudioTime(anchorAt(0, 0, 2), 1)).toBeCloseTo(0.5);
  });
});

describe('reanchor (đổi tốc độ lúc đang chạy)', () => {
  it('giữ nguyên vị trí tại thời điểm đổi, không nhảy', () => {
    const before = anchorAt(0, 0, 1);
    const after = reanchor(before, 3, 2);
    expect(positionAt(after, 3)).toBeCloseTo(positionAt(before, 3));
  });

  it('sau khi đổi, vị trí tăng theo tốc độ mới', () => {
    const after = reanchor(anchorAt(0, 0, 1), 3, 2);
    expect(positionAt(after, 4)).toBeCloseTo(3 + 2);
  });

  it('không sửa anchor cũ (bất biến)', () => {
    const before = Object.freeze(anchorAt(0, 0, 1));
    expect(() => reanchor(before, 3, 2)).not.toThrow();
    expect(before.speed).toBe(1);
  });
});

describe('eventsInWindow', () => {
  const events = [
    { t: 0.5, padId: 'kick' },
    { t: 1.5, padId: 'snare' },
  ];
  const loopLen = 2;
  const ids = (list) => list.map((e) => e.padId);

  it('trong vòng đầu chỉ lấy sự kiện rơi vào [from, to)', () => {
    expect(ids(eventsInWindow(events, loopLen, 0, 1))).toEqual(['kick']);
    expect(ids(eventsInWindow(events, loopLen, 1, 2))).toEqual(['snare']);
  });

  it('from bao gồm, to không bao gồm', () => {
    expect(ids(eventsInWindow(events, loopLen, 0.5, 1.5))).toEqual(['kick']);
    expect(ids(eventsInWindow(events, loopLen, 0.5001, 1.5001))).toEqual(['snare']);
  });

  it('cửa sổ vắt qua cuối vòng lấy tiếp sự kiện của vòng sau, t cộng dồn', () => {
    const got = eventsInWindow(events, loopLen, 1.9, 2.6);
    expect(got).toEqual([{ t: 2.5, padId: 'kick' }]);
  });

  it('lặp nhiều vòng, trả theo thứ tự thời gian', () => {
    const got = eventsInWindow(events, loopLen, 0, 6);
    expect(got.map((e) => e.t)).toEqual([0.5, 1.5, 2.5, 3.5, 4.5, 5.5]);
    expect(ids(got)).toEqual(['kick', 'snare', 'kick', 'snare', 'kick', 'snare']);
  });

  it('repeat=false (chế độ Once) chỉ lấy vòng đầu', () => {
    const got = eventsInWindow(events, loopLen, 0, 6, false);
    expect(got.map((e) => e.t)).toEqual([0.5, 1.5]);
  });

  it('các cửa sổ liên tiếp không trùng và không sót (không phát đúp, không rớt hit)', () => {
    const cuts = [0, 0.3, 0.9, 1.6, 2.05, 3.7, 6];
    const piecewise = [];
    for (let i = 0; i < cuts.length - 1; i++) piecewise.push(...eventsInWindow(events, loopLen, cuts[i], cuts[i + 1]));
    expect(piecewise).toEqual(eventsInWindow(events, loopLen, 0, 6));
  });

  it('không có sự kiện hoặc cửa sổ rỗng thì trả mảng rỗng', () => {
    expect(eventsInWindow([], loopLen, 0, 10)).toEqual([]);
    expect(eventsInWindow(events, loopLen, 1, 1)).toEqual([]);
  });

  it('không sửa mảng events đầu vào', () => {
    const frozen = Object.freeze(events.map((e) => Object.freeze({ ...e })));
    expect(() => eventsInWindow(frozen, loopLen, 0, 6)).not.toThrow();
  });
});
