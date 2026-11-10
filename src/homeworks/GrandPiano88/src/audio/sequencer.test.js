import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildTimeline, playSequence, sleep, startOffsets } from './sequencer.js';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const EVENTS = [
  { midi: 60, freqHz: 261.63, durationMs: 100, deltaMs: 0 },
  { midi: 64, freqHz: 329.63, durationMs: 100, deltaMs: 200 },
];

/** Chạy playSequence, ghi lại (thời điểm, hành động) theo đồng hồ giả. */
function start(events, options = {}) {
  const log = [];
  const t0 = performance.now();
  const controller = new AbortController();
  const promise = playSequence(events, {
    noteOn: (midi) => log.push([performance.now() - t0, 'on', midi]),
    noteOff: (midi) => log.push([performance.now() - t0, 'off', midi]),
    signal: controller.signal,
    ...options,
  });
  return { log, promise, controller };
}

describe('startOffsets / buildTimeline', () => {
  it('cộng dồn deltaMs thành mốc bắt đầu', () => {
    expect(startOffsets(EVENTS)).toEqual([0, 200]);
  });

  it('dòng thời gian sắp theo mốc, nhả đứng trước nhấn khi trùng mốc', () => {
    const repeated = [
      { midi: 60, freqHz: 1, durationMs: 100, deltaMs: 0 },
      { midi: 60, freqHz: 1, durationMs: 100, deltaMs: 100 }, // nhấn lại đúng lúc nốt trước hết
    ];
    expect(buildTimeline(repeated, 1).map((s) => `${s.type}@${s.at}`)).toEqual(['on@0', 'off@100', 'on@100', 'off@200']);
  });

  it('chia mốc cho tốc độ', () => {
    expect(buildTimeline(EVENTS, 2).map((s) => s.at)).toEqual([0, 50, 100, 150]);
  });
});

describe('playSequence (H2-09)', () => {
  it('ở 1x: nhấn/nhả đúng mốc 0, 100, 200, 300 ms và trả "done"', async () => {
    const { log, promise } = start(EVENTS, { speed: 1 });
    await vi.advanceTimersByTimeAsync(400);
    expect(await promise).toBe('done');
    expect(log).toEqual([
      [0, 'on', 60],
      [100, 'off', 60],
      [200, 'on', 64],
      [300, 'off', 64],
    ]);
  });

  it('2x nhanh gấp đôi', async () => {
    const { log, promise } = start(EVENTS, { speed: 2 });
    await vi.advanceTimersByTimeAsync(400);
    await promise;
    expect(log.map((l) => l[0])).toEqual([0, 50, 100, 150]);
  });

  it('0,5x chậm gấp đôi', async () => {
    const { log, promise } = start(EVENTS, { speed: 0.5 });
    await vi.advanceTimersByTimeAsync(800);
    await promise;
    expect(log.map((l) => l[0])).toEqual([0, 200, 400, 600]);
  });

  it('mặc định speed = 1', async () => {
    const { log, promise } = start(EVENTS);
    await vi.advanceTimersByTimeAsync(400);
    await promise;
    expect(log.at(-1)[0]).toBe(300);
  });

  it('không cộng dồn sai số: mỗi bước trễ 7 ms nhưng nốt thứ 10 vẫn chỉ trễ 7 ms, không phải 70', async () => {
    const laggySleep = async (ms, signal) => {
      await sleep(ms, signal);
      await sleep(7, signal); // mỗi bước bị trễ thêm 7 ms (máy bận)
    };
    const many = Array.from({ length: 10 }, (_, i) => ({ midi: 60 + i, freqHz: 1, durationMs: 10, deltaMs: i === 0 ? 0 : 100 }));
    const { log, promise } = start(many, { sleepFn: laggySleep });
    await vi.advanceTimersByTimeAsync(2000);
    await promise;
    const onTimes = log.filter((l) => l[1] === 'on').map((l) => l[0]);
    expect(onTimes).toEqual([7, 107, 207, 307, 407, 507, 607, 707, 807, 907]);
  });

  it('nốt đầu phát ngay (0 ms) dù deltaMs = 0', async () => {
    const { log, promise } = start([EVENTS[0]]);
    await vi.advanceTimersByTimeAsync(0);
    expect(log[0]).toEqual([0, 'on', 60]);
    await vi.advanceTimersByTimeAsync(200);
    await promise;
  });

  it('bản ghi rỗng trả "done" ngay, không có timer', async () => {
    const { promise } = start([]);
    expect(await promise).toBe('done');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('huỷ giữa chừng: không gọi thêm noteOn, nhả nốt đang giữ, trả "aborted", không còn timer', async () => {
    const { log, promise, controller } = start(EVENTS);
    await vi.advanceTimersByTimeAsync(50); // nốt 60 đang giữ
    controller.abort();
    expect(await promise).toBe('aborted');
    expect(log).toEqual([
      [0, 'on', 60],
      [50, 'off', 60],
    ]);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(log).toHaveLength(2); // nốt 64 không bao giờ phát
  });

  it('huỷ trước khi bắt đầu: không phát gì', async () => {
    const controller = new AbortController();
    controller.abort();
    const noteOn = vi.fn();
    const result = await playSequence(EVENTS, { noteOn, noteOff: vi.fn(), signal: controller.signal });
    expect(result).toBe('aborted');
    expect(noteOn).not.toHaveBeenCalled();
  });

  it('chỉ nhả những nốt do lần phát này nhấn', async () => {
    const { log, promise, controller } = start(EVENTS);
    await vi.advanceTimersByTimeAsync(150); // 60 đã nhả lúc 100, chưa có nốt nào giữ
    controller.abort();
    await promise;
    expect(log.filter((l) => l[1] === 'off')).toEqual([[100, 'off', 60]]);
  });

  it('nốt cùng phím nhấn lại đúng lúc: nhả trước rồi mới nhấn', async () => {
    const repeated = [
      { midi: 60, freqHz: 1, durationMs: 100, deltaMs: 0 },
      { midi: 60, freqHz: 1, durationMs: 100, deltaMs: 100 },
    ];
    const { log, promise } = start(repeated);
    await vi.advanceTimersByTimeAsync(300);
    await promise;
    expect(log.map((l) => `${l[1]}@${l[0]}`)).toEqual(['on@0', 'off@100', 'on@100', 'off@200']);
  });

  it('speed không hợp lệ thì từ chối', async () => {
    const signal = new AbortController().signal;
    await expect(playSequence(EVENTS, { speed: 0, noteOn: vi.fn(), noteOff: vi.fn(), signal })).rejects.toThrow(RangeError);
  });

  it('lỗi khác AbortError (ví dụ noteOn ném lỗi) không bị nuốt', async () => {
    const signal = new AbortController().signal;
    const promise = playSequence(EVENTS, {
      noteOn: () => {
        throw new Error('hỏng');
      },
      noteOff: vi.fn(),
      signal,
    });
    const assertion = expect(promise).rejects.toThrow('hỏng');
    await vi.advanceTimersByTimeAsync(10);
    await assertion;
  });
});

describe('sleep', () => {
  it('huỷ thì dọn timer và gỡ listener', async () => {
    const controller = new AbortController();
    const waiting = sleep(1000, controller.signal);
    const assertion = expect(waiting).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('chờ xong thì không để lại timer', async () => {
    const controller = new AbortController();
    const waiting = sleep(100, controller.signal);
    await vi.advanceTimersByTimeAsync(100);
    await waiting;
    expect(vi.getTimerCount()).toBe(0);
  });
});
