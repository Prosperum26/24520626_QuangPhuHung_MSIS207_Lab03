import { A4_HZ, A4_MIDI, MIDI_MAX, MIDI_MIN } from '../pianoConfig.js';

/** @typedef {{ midi:number, noteName:string, isBlack:boolean, freqHz:number, pitchClass:number, octave:number }} KeyDef */

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

/** f = 440 * 2^((midi - 69) / 12): mỗi nửa cung nhân căn bậc 12 của 2. */
export function midiToFreq(midi) {
  return A4_HZ * 2 ** ((midi - A4_MIDI) / 12);
}

/** Nốt trong quãng 12 nửa cung: 0 = C, 1 = C#, ... 11 = B. */
export const pitchClassOf = (midi) => midi % 12;

/** Số quãng tám theo quy ước MIDI: C4 = 60, A0 = 21. */
export const octaveOf = (midi) => Math.floor(midi / 12) - 1;

/** Tên ngắn hiển thị, ví dụ "C#4". */
export function noteName(midi) {
  return `${SHARP_NAMES[pitchClassOf(midi)]}${octaveOf(midi)}`;
}

/**
 * Tên cho trình đọc màn hình: "C#4" đọc thành "C thăng 4" (ký tự # dễ bị đọc sai).
 * Nốt tự nhiên giữ nguyên "C4" để khớp chữ hiển thị trên phím (WCAG 2.5.3 Label in Name).
 */
export function spokenName(midi) {
  const name = SHARP_NAMES[pitchClassOf(midi)];
  if (name.length === 1) return `${name}${octaveOf(midi)}`;
  return `${name[0]} thăng ${octaveOf(midi)}`;
}

/** Sinh danh sách phím từ phạm vi MIDI, không viết tay từng phím. */
export function buildKeys(minMidi = MIDI_MIN, maxMidi = MIDI_MAX) {
  const keys = [];
  for (let midi = minMidi; midi <= maxMidi; midi += 1) {
    const pitchClass = pitchClassOf(midi);
    keys.push({
      midi,
      noteName: noteName(midi),
      isBlack: BLACK_PITCH_CLASSES.has(pitchClass),
      freqHz: midiToFreq(midi),
      pitchClass,
      octave: octaveOf(midi),
    });
  }
  return keys;
}

/** Gom phím liên tiếp theo quãng tám để bố cục theo từng quãng. Quãng đầu và cuối có thể thiếu phím. */
export function groupByOctave(keys) {
  const groups = [];
  for (const key of keys) {
    const last = groups.at(-1);
    if (last && last.octave === key.octave) last.keys.push(key);
    else groups.push({ octave: key.octave, keys: [key] });
  }
  return groups;
}

/** Cột (1..7) của phím trắng trong một quãng tám: C D E F G A B. CSS dùng cùng bảng này theo data-pc. */
const WHITE_COLUMN = { 0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7 };
const COLUMNS_PER_OCTAVE = 7;

/**
 * Quãng đầu/cuối của đàn thiếu phím (A0..B0 chỉ có 2 phím trắng, C8 chỉ có 1).
 * lead = số cột trắng thiếu ở đầu, trail = số cột trắng thiếu ở cuối; CSS dùng để co khung lại.
 */
export function octaveLayout(group) {
  const whites = group.keys.filter((key) => !key.isBlack);
  if (whites.length === 0) return { lead: 0, trail: 0 };
  return {
    lead: WHITE_COLUMN[whites[0].pitchClass] - 1,
    trail: COLUMNS_PER_OCTAVE - WHITE_COLUMN[whites.at(-1).pitchClass],
  };
}
