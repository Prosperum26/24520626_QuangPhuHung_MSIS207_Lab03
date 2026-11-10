import { describe, it, expect } from 'vitest';
import { createRecorder } from './recorder.js';

/** Đồng hồ giả: `clock.t` do test điều khiển. */
function setup() {
  const clock = { t: 1000 };
  const recorder = createRecorder({ now: () => clock.t });
  return { recorder, clock };
}

describe('createRecorder (H2-08)', () => {
  it('ghi đúng {midi, freqHz, durationMs, deltaMs}; nốt đầu deltaMs = 0', () => {
    const { recorder, clock } = setup();
    recorder.start();
    recorder.noteOn(60, 261.63);
    clock.t += 250;
    recorder.noteOff(60);
    expect(recorder.stop()).toEqual([{ midi: 60, freqHz: 261.63, durationMs: 250, deltaMs: 0 }]);
  });

  it('thứ tự ghi giữ nguyên và deltaMs tính từ lúc BẮT ĐẦU nốt trước', () => {
    const { recorder, clock } = setup();
    recorder.start();
    recorder.noteOn(60, 1);
    clock.t += 100;
    recorder.noteOff(60);
    clock.t += 400; // nghỉ
    recorder.noteOn(64, 2);
    clock.t += 50;
    recorder.noteOff(64);
    clock.t += 30;
    recorder.noteOn(67, 3);
    clock.t += 10;
    recorder.noteOff(67);
    const events = recorder.stop();
    expect(events.map((e) => e.midi)).toEqual([60, 64, 67]);
    expect(events.map((e) => e.deltaMs)).toEqual([0, 500, 80]); // 500 = 100 + 400; 80 = 50 + 30
    expect(events.map((e) => e.durationMs)).toEqual([100, 50, 10]);
  });

  it('hợp âm: nhấn A, nhấn B, nhả A, nhả B vẫn ra thứ tự A rồi B (D5)', () => {
    const { recorder, clock } = setup();
    recorder.start();
    recorder.noteOn(60, 1);
    clock.t += 10;
    recorder.noteOn(64, 2);
    clock.t += 90;
    recorder.noteOff(60); // A nhả trước B
    clock.t += 100;
    recorder.noteOff(64);
    const events = recorder.stop();
    expect(events.map((e) => e.midi)).toEqual([60, 64]);
    expect(events.map((e) => e.durationMs)).toEqual([100, 190]);
    expect(events[1].deltaMs).toBe(10);
  });

  it('nốt nhấn sau nhưng nhả TRƯỚC vẫn đứng sau trong mảng (thứ tự theo lúc nhấn, không theo lúc nhả)', () => {
    const { recorder, clock } = setup();
    recorder.start();
    recorder.noteOn(60, 1); // A nhấn trước
    clock.t += 10;
    recorder.noteOn(64, 2); // B nhấn sau
    clock.t += 20;
    recorder.noteOff(64); // B nhả trước
    clock.t += 20;
    recorder.noteOff(60);
    expect(recorder.stop().map((e) => e.midi)).toEqual([60, 64]);
  });

  it('khoảng lặng trước nốt đầu bị cắt (deltaMs nốt đầu = 0 dù bấm Ghi từ lâu)', () => {
    const { recorder, clock } = setup();
    recorder.start();
    clock.t += 5000;
    recorder.noteOn(60, 1);
    clock.t += 10;
    recorder.noteOff(60);
    expect(recorder.stop()[0].deltaMs).toBe(0);
  });

  it('stop() đóng nốt còn mở với thời lượng tới lúc dừng', () => {
    const { recorder, clock } = setup();
    recorder.start();
    recorder.noteOn(60, 1);
    clock.t += 300;
    const events = recorder.stop();
    expect(events[0].durationMs).toBe(300);
    expect(recorder.isRecording).toBe(false);
  });

  it('không ghi khi chưa start() và sau stop()', () => {
    const { recorder } = setup();
    recorder.noteOn(60, 1);
    expect(recorder.events).toEqual([]);
    recorder.start();
    recorder.stop();
    recorder.noteOn(62, 2);
    expect(recorder.events).toEqual([]);
  });

  it('noteOn lặp cùng midi khi chưa nhả bị bỏ qua; noteOff nốt chưa nhấn bị bỏ qua', () => {
    const { recorder } = setup();
    recorder.start();
    recorder.noteOn(60, 1);
    recorder.noteOn(60, 1);
    recorder.noteOff(99);
    expect(recorder.stop()).toHaveLength(1);
  });

  it('start() lần nữa xoá bản ghi cũ', () => {
    const { recorder, clock } = setup();
    recorder.start();
    recorder.noteOn(60, 1);
    clock.t += 10;
    recorder.noteOff(60);
    recorder.stop();
    recorder.start();
    expect(recorder.events).toEqual([]);
  });

  it('releaseAll() đóng nốt đang giữ nhưng vẫn tiếp tục ghi', () => {
    const { recorder, clock } = setup();
    recorder.start();
    recorder.noteOn(60, 1);
    clock.t += 70;
    recorder.releaseAll();
    expect(recorder.isRecording).toBe(true);
    expect(recorder.events[0].durationMs).toBe(70);
    clock.t += 500;
    recorder.noteOff(60); // đã đóng rồi, không ghi đè
    expect(recorder.events[0].durationMs).toBe(70);
  });

  it('events và stop() trả bản sao: sửa bản sao không đổi bản ghi', () => {
    const { recorder, clock } = setup();
    recorder.start();
    recorder.noteOn(60, 1);
    clock.t += 10;
    recorder.noteOff(60);
    recorder.events[0].midi = 1;
    expect(recorder.events[0].midi).toBe(60);
  });
});
