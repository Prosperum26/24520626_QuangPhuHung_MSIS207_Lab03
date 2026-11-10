import { describe, it, expect } from 'vitest';
import * as config from './pianoConfig.js';

describe('pianoConfig', () => {
  it('phạm vi MIDI là 88 phím (A0 đến C8)', () => {
    expect(config.MIDI_MAX - config.MIDI_MIN + 1).toBe(88);
  });

  it('tổng gain của MAX_VOICES voice không vượt 1 (không méo)', () => {
    expect(config.MAX_VOICES * config.VOICE_GAIN).toBeLessThanOrEqual(1);
  });

  it('đích ramp mũ lớn hơn 0 (exponentialRamp không tới được 0)', () => {
    expect(config.RELEASE_FLOOR).toBeGreaterThan(0);
  });

  it('tốc độ phát lại gồm 0,5x, 1x, 2x', () => {
    expect(config.SPEEDS).toEqual([0.5, 1, 2]);
  });
});
