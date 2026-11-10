import { describe, it, expect } from 'vitest';
import { buildKeys, groupByOctave, midiToFreq, noteName, spokenName } from './notes.js';

describe('midiToFreq', () => {
  it('A4 (69) = 440 Hz', () => {
    expect(midiToFreq(69)).toBe(440);
  });

  it('A0 (21) = 27,5 Hz', () => {
    expect(midiToFreq(21)).toBeCloseTo(27.5, 6);
  });

  it('C8 (108) ≈ 4186,01 Hz', () => {
    expect(midiToFreq(108)).toBeCloseTo(4186.01, 2);
  });

  it('lên một quãng tám (12 nửa cung) thì tần số gấp đôi', () => {
    expect(midiToFreq(81) / midiToFreq(69)).toBeCloseTo(2, 10);
  });
});

describe('noteName và spokenName', () => {
  it('đặt tên theo quy ước MIDI: 21 = A0, 60 = C4, 108 = C8', () => {
    expect([21, 60, 108].map(noteName)).toEqual(['A0', 'C4', 'C8']);
  });

  it('nốt thăng có dấu #', () => {
    expect(noteName(61)).toBe('C#4');
  });

  it('spokenName đọc "thăng" và tách số quãng', () => {
    expect(spokenName(61)).toBe('C thăng 4');
    expect(spokenName(60)).toBe('C 4');
  });
});

describe('buildKeys', () => {
  const keys = buildKeys();

  it('đủ 88 phím, MIDI 21..108 liên tục', () => {
    expect(keys).toHaveLength(88);
    expect(keys.map((k) => k.midi)).toEqual(Array.from({ length: 88 }, (_, i) => 21 + i));
  });

  it('52 phím trắng + 36 phím đen', () => {
    expect(keys.filter((k) => !k.isBlack)).toHaveLength(52);
    expect(keys.filter((k) => k.isBlack)).toHaveLength(36);
  });

  it('midi không trùng (dùng làm key React được)', () => {
    expect(new Set(keys.map((k) => k.midi)).size).toBe(88);
  });

  it('phím đen đúng vị trí: C#4 (61) đen, C4 (60) và E4 (64) trắng', () => {
    const byMidi = new Map(keys.map((k) => [k.midi, k]));
    expect(byMidi.get(61).isBlack).toBe(true);
    expect(byMidi.get(60).isBlack).toBe(false);
    expect(byMidi.get(64).isBlack).toBe(false);
  });

  it('mỗi phím mang tần số đúng', () => {
    expect(keys.find((k) => k.midi === 69).freqHz).toBe(440);
  });

  it('đổi phạm vi thì số phím tự đổi (61 phím: MIDI 36..96)', () => {
    expect(buildKeys(36, 96)).toHaveLength(61);
  });
});

describe('groupByOctave', () => {
  const groups = groupByOctave(buildKeys());

  it('quãng đầu (octave 0) có 3 phím A0 A#0 B0, quãng cuối (octave 8) chỉ có C8', () => {
    expect(groups[0].octave).toBe(0);
    expect(groups[0].keys.map((k) => k.noteName)).toEqual(['A0', 'A#0', 'B0']);
    expect(groups.at(-1).octave).toBe(8);
    expect(groups.at(-1).keys).toHaveLength(1);
  });

  it('các quãng giữa đủ 12 phím và tổng vẫn là 88', () => {
    expect(groups).toHaveLength(9);
    expect(groups.slice(1, -1).every((g) => g.keys.length === 12)).toBe(true);
    expect(groups.reduce((n, g) => n + g.keys.length, 0)).toBe(88);
  });
});
