import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { KITS, DEFAULT_KIT_ID, kitUrl } from './kits.js';
import { PADS } from './drumPads.js';

const PUBLIC_DIR = join(process.cwd(), 'public');

describe('kits', () => {
  it('có kit mặc định nằm trong danh sách', () => {
    expect(KITS.map((k) => k.id)).toContain(DEFAULT_KIT_ID);
  });

  it('id kit duy nhất và có nhãn', () => {
    expect(new Set(KITS.map((k) => k.id)).size).toBe(KITS.length);
    for (const kit of KITS) expect(kit.label).not.toBe('');
  });

  for (const kit of KITS) {
    describe(`kit ${kit.id}`, () => {
      it('đủ file WAV hợp lệ cho cả 7 padId', () => {
        for (const pad of PADS) {
          const file = join(PUBLIC_DIR, kitUrl(kit.id, pad.id));
          expect(existsSync(file), `${pad.id}.wav`).toBe(true);
          const head = readFileSync(file).subarray(0, 12);
          expect(head.toString('ascii', 0, 4)).toBe('RIFF');
          expect(head.toString('ascii', 8, 12)).toBe('WAVE');
        }
      });
    });
  }

  it('kitUrl ném lỗi với kit lạ', () => {
    expect(() => kitUrl('nope', 'kick')).toThrow(/nope/);
  });

  it('URL là đường dẫn tương đối theo thư mục public', () => {
    expect(kitUrl(DEFAULT_KIT_ID, 'kick')).toBe(`kits/${DEFAULT_KIT_ID}/kick.wav`);
  });
});
