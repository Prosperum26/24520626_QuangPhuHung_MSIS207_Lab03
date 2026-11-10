import { describe, it, expect, vi } from 'vitest';
import { PolyphonicSynth } from './PolyphonicSynth.js';
import { createFakeAudio } from './fakeAudio.js';
import { ATTACK_S, RELEASE_FLOOR, RELEASE_S, VOICE_GAIN } from '../pianoConfig.js';

function setup(maxVoices) {
  const audio = createFakeAudio();
  const onSteal = vi.fn();
  const synth = new PolyphonicSynth(maxVoices, { createContext: () => audio.ctx, onSteal });
  return { synth, audio, onSteal };
}
const indexOf = (calls, name, id) => calls.findIndex((c) => c[0] === name && c[1] === id);

describe('PolyphonicSynth: noteOn / noteOff (H2-03)', () => {
  it('không tạo AudioContext cho tới lần noteOn đầu tiên', () => {
    const createContext = vi.fn();
    new PolyphonicSynth(8, { createContext });
    expect(createContext).not.toHaveBeenCalled();
  });

  it('noteOn đặt tần số, nối node rồi start', () => {
    const { synth, audio } = setup();
    synth.noteOn(69, 440);
    const names = audio.calls.map((c) => c[0]);
    expect(audio.calls).toContainEqual(['freq', 0, 440, 0]);
    expect(names).toEqual(expect.arrayContaining(['osc.connect', 'gain.connect', 'osc.start']));
    expect(synth.voiceCount).toBe(1);
  });

  it('có attack: gain bắt đầu từ 0 rồi tăng lên VOICE_GAIN trong ATTACK_S', () => {
    const { synth, audio } = setup();
    synth.noteOn(60, 261.6);
    expect(audio.calls).toContainEqual(['gain.set', 0, 0, 0]);
    expect(audio.calls).toContainEqual(['gain.linear', 0, VOICE_GAIN, ATTACK_S]);
  });

  it('noteOff: ramp mũ về RELEASE_FLOOR trong RELEASE_S, và ramp xảy ra TRƯỚC osc.stop', () => {
    const { synth, audio } = setup();
    synth.noteOn(60, 261.6);
    audio.ctx.currentTime = 1;
    synth.noteOff(60);
    expect(audio.calls).toContainEqual(['gain.exp', 0, RELEASE_FLOOR, 1 + RELEASE_S]);
    expect(audio.calls).toContainEqual(['osc.stop', 0, 1 + RELEASE_S]);
    expect(indexOf(audio.calls, 'gain.exp', 0)).toBeLessThan(indexOf(audio.calls, 'osc.stop', 0));
  });

  it('noteOff: voiceCount về 0 ngay (Map chỉ giữ nốt đang giữ phím)', () => {
    const { synth } = setup();
    synth.noteOn(60, 261.6);
    synth.noteOff(60);
    expect(synth.voiceCount).toBe(0);
  });

  it('hết tiếng (onended) thì ngắt osc và gain để giải phóng node', () => {
    const { synth, audio } = setup();
    synth.noteOn(60, 261.6);
    synth.noteOff(60);
    expect(audio.calls.some((c) => c[0] === 'osc.disconnect')).toBe(false);
    audio.oscillators[0].end();
    expect(audio.calls).toContainEqual(['osc.disconnect', 0]);
    expect(audio.calls).toContainEqual(['gain.disconnect', 0]);
  });

  it('noteOn lặp cùng midi (giữ phím) không tạo voice mới', () => {
    const { synth, audio } = setup();
    synth.noteOn(60, 261.6);
    synth.noteOn(60, 261.6);
    expect(audio.oscillators).toHaveLength(1);
    expect(synth.voiceCount).toBe(1);
  });

  it('noteOff một nốt không đang giữ thì bỏ qua, không lỗi', () => {
    const { synth, audio } = setup();
    expect(() => synth.noteOff(60)).not.toThrow();
    expect(audio.calls).toEqual([]);
  });

  it('nhả giữa lúc attack: ramp bắt đầu từ mức dương, không từ 0 (exponentialRamp không chạy từ 0)', () => {
    const { synth, audio } = setup();
    synth.noteOn(60, 261.6);
    synth.noteOff(60);
    const setCalls = audio.calls.filter((c) => c[0] === 'gain.set' && c[1] === 0);
    expect(setCalls.at(-1)[2]).toBeGreaterThan(0);
  });

  it('context đang suspended thì resume()', () => {
    const { synth, audio } = setup();
    audio.ctx.state = 'suspended';
    synth.noteOn(60, 261.6);
    expect(audio.state.resumed).toBe(1);
  });

  it('không có AudioContext (createContext trả null) thì noteOn không làm gì', () => {
    const synth = new PolyphonicSynth(8, { createContext: () => null });
    expect(() => synth.noteOn(60, 261.6)).not.toThrow();
    expect(synth.voiceCount).toBe(0);
  });
});

describe('PolyphonicSynth: giới hạn voice và steal FIFO (H2-04)', () => {
  const press = (synth, from, count) => {
    for (let i = 0; i < count; i += 1) synth.noteOn(from + i, 440);
  };

  it('8 nốt đầu không bị cướp', () => {
    const { synth, onSteal } = setup(8);
    press(synth, 60, 8);
    expect(synth.voiceCount).toBe(8);
    expect(onSteal).not.toHaveBeenCalled();
  });

  it('nốt thứ 9 cướp đúng voice đầu tiên: tắt dần rồi dừng, báo onSteal, vẫn đủ 8 voice', () => {
    const { synth, audio, onSteal } = setup(8);
    press(synth, 60, 9);
    expect(onSteal).toHaveBeenCalledTimes(1);
    expect(onSteal).toHaveBeenCalledWith(60);
    expect(synth.voiceCount).toBe(8);
    expect(audio.calls).toContainEqual(['gain.exp', 0, RELEASE_FLOOR, RELEASE_S]); // voice 0 là nốt 60
    expect(indexOf(audio.calls, 'gain.exp', 0)).toBeLessThan(indexOf(audio.calls, 'osc.stop', 0));
  });

  it('thứ tự cướp là FIFO qua nhiều nốt: 60, 61, 62 lần lượt', () => {
    const { synth, onSteal } = setup(8);
    press(synth, 60, 11);
    expect(onSteal.mock.calls.map((c) => c[0])).toEqual([60, 61, 62]);
  });

  it('nhả nốt giữa chừng không làm lệch thứ tự: nốt còn lại cũ nhất bị cướp trước', () => {
    const { synth, onSteal } = setup(3);
    press(synth, 60, 3); // 60, 61, 62
    synth.noteOff(60);
    synth.noteOn(63, 440); // còn 2 voice nên không cướp
    expect(onSteal).not.toHaveBeenCalled();
    synth.noteOn(64, 440); // đủ 3 (61, 62, 63) nên cướp 61
    expect(onSteal).toHaveBeenCalledWith(61);
  });

  it('nốt vừa nhả rồi nhấn lại tính là mới nhất', () => {
    const { synth, onSteal } = setup(3);
    press(synth, 60, 3);
    synth.noteOff(60);
    synth.noteOn(60, 440); // 60 giờ đứng cuối hàng: 61, 62, 60
    synth.noteOn(70, 440);
    expect(onSteal).toHaveBeenCalledWith(61);
  });

  it('đổi maxVoices thành 4 thì giới hạn là 4', () => {
    const { synth, onSteal } = setup(4);
    press(synth, 60, 5);
    expect(synth.voiceCount).toBe(4);
    expect(onSteal).toHaveBeenCalledWith(60);
  });

  it('nốt bị cướp rồi nhả phím thì bỏ qua (không lỗi, không đổi voiceCount)', () => {
    const { synth } = setup(2);
    press(synth, 60, 3); // 60 bị cướp
    expect(() => synth.noteOff(60)).not.toThrow();
    expect(synth.voiceCount).toBe(2);
  });

  it('stopAll(): voiceCount === 0 và mọi oscillator đều dừng sau ramp', () => {
    const { synth, audio } = setup(8);
    press(synth, 60, 5);
    synth.stopAll();
    expect(synth.voiceCount).toBe(0);
    for (let id = 0; id < 5; id += 1) {
      expect(indexOf(audio.calls, 'gain.exp', id)).toBeGreaterThan(-1);
      expect(indexOf(audio.calls, 'gain.exp', id)).toBeLessThan(indexOf(audio.calls, 'osc.stop', id));
    }
  });

  it('stopAll() không gọi onSteal (dừng chủ động, không phải bị cướp)', () => {
    const { synth, onSteal } = setup(8);
    press(synth, 60, 3);
    synth.stopAll();
    expect(onSteal).not.toHaveBeenCalled();
  });

  it('dispose(): dừng mọi nốt, đóng context, và noteOn sau đó không có tác dụng', () => {
    const { synth, audio } = setup(8);
    press(synth, 60, 2);
    synth.dispose();
    expect(synth.voiceCount).toBe(0);
    expect(audio.state.closed).toBe(true);
    synth.noteOn(70, 440);
    expect(synth.voiceCount).toBe(0);
  });
});
