import { renderHook, act } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLooper } from './useLooper.js';
import { TICK_MS } from './looperConfig.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup(options = {}) {
  const clock = { t: 0 };
  const trigger = vi.fn();
  const now = () => clock.t;
  const hook = renderHook(() => useLooper({ trigger, now }), options);
  /** Tiến đồng hồ giả và timer từng TICK_MS một, như thật. */
  const advance = (ms) => {
    for (let elapsed = 0; elapsed < ms; elapsed += TICK_MS) {
      clock.t += TICK_MS / 1000;
      act(() => vi.advanceTimersByTime(TICK_MS));
    }
  };
  const looper = () => hook.result.current;
  const whens = (padId) => trigger.mock.calls.filter(([id]) => id === padId).map(([, opts]) => opts.when);
  return { hook, clock, trigger, advance, looper, whens };
}

/** Ghi vòng dài 1 giây: kick ở 0, snare ở 0,5; dừng ở 1,0 giây thì bắt đầu phát. */
function recordLoop(ctx) {
  act(() => ctx.looper().record());
  act(() => ctx.looper().capture('kick'));
  ctx.advance(500);
  act(() => ctx.looper().capture('snare'));
  ctx.advance(500);
  act(() => ctx.looper().record());
}

describe('useLooper: ghi', () => {
  it('ban đầu là empty, không phát gì', () => {
    const ctx = setup();
    expect(ctx.looper().mode).toBe('empty');
    ctx.advance(500);
    expect(ctx.trigger).not.toHaveBeenCalled();
  });

  it('record: empty -> recording -> playing, vòng dài bằng thời gian đã ghi', () => {
    const ctx = setup();
    act(() => ctx.looper().record());
    expect(ctx.looper().mode).toBe('recording');
    act(() => ctx.looper().capture('kick'));
    ctx.advance(1000);
    act(() => ctx.looper().record());
    expect(ctx.looper().mode).toBe('playing');
  });

  it('dừng ghi khi chưa có hit nào thì về empty', () => {
    const ctx = setup();
    act(() => ctx.looper().record());
    ctx.advance(1000);
    act(() => ctx.looper().record());
    expect(ctx.looper().mode).toBe('empty');
  });

  it('vòng quá ngắn bị bỏ', () => {
    const ctx = setup();
    act(() => ctx.looper().record());
    act(() => ctx.looper().capture('kick'));
    ctx.advance(100);
    act(() => ctx.looper().record());
    expect(ctx.looper().mode).toBe('empty');
  });

  it('capture ngoài lúc ghi/overdub bị bỏ qua', () => {
    const ctx = setup();
    act(() => ctx.looper().capture('kick'));
    recordLoop(ctx);
    ctx.trigger.mockClear();
    act(() => ctx.looper().capture('tom')); // đang playing, không overdub
    ctx.advance(2000);
    expect(ctx.whens('tom')).toEqual([]);
  });
});

describe('useLooper: phát lại', () => {
  it('lặp liên tục: phát đúng giờ audio, mỗi vòng một lần, không đúp', () => {
    const ctx = setup();
    recordLoop(ctx); // anchor tại giờ 1.0
    ctx.advance(2500);
    const kicks = ctx.whens('kick');
    const snares = ctx.whens('snare');
    expect(kicks.slice(0, 3).map((w) => +w.toFixed(3))).toEqual([1, 2, 3]);
    expect(snares.slice(0, 2).map((w) => +w.toFixed(3))).toEqual([1.5, 2.5]);
    expect(new Set(kicks).size).toBe(kicks.length);
    expect(new Set(snares).size).toBe(snares.length);
  });

  it('chế độ Một lần: hết vòng thì về ready và không phát thêm; Play phát lại từ đầu', () => {
    const ctx = setup();
    recordLoop(ctx);
    act(() => ctx.looper().setLoopMode('once'));
    ctx.advance(1500);
    expect(ctx.looper().mode).toBe('ready');
    expect(ctx.whens('kick')).toHaveLength(1);
    expect(ctx.whens('snare')).toHaveLength(1);

    ctx.advance(1000);
    expect(ctx.trigger).toHaveBeenCalledTimes(2);

    act(() => ctx.looper().togglePlay());
    expect(ctx.looper().mode).toBe('playing');
    ctx.advance(200);
    expect(ctx.whens('kick')).toHaveLength(2);
  });

  it('Stop: playing -> ready, hết phát; Play: ready -> playing', () => {
    const ctx = setup();
    recordLoop(ctx);
    ctx.advance(300);
    act(() => ctx.looper().togglePlay());
    expect(ctx.looper().mode).toBe('ready');
    ctx.trigger.mockClear();
    ctx.advance(2000);
    expect(ctx.trigger).not.toHaveBeenCalled();
    act(() => ctx.looper().togglePlay());
    expect(ctx.looper().mode).toBe('playing');
  });

  it('progress chạy từ 0 đến 100 trong vòng, rồi về 0 khi dừng', () => {
    const ctx = setup();
    recordLoop(ctx);
    ctx.advance(500);
    expect(ctx.looper().progress).toBeGreaterThanOrEqual(45);
    expect(ctx.looper().progress).toBeLessThanOrEqual(55);
    act(() => ctx.looper().togglePlay());
    expect(ctx.looper().progress).toBe(0);
  });
});

describe('useLooper: overdub', () => {
  it('hit overdub vào vòng sau, không phát đúp ở vòng hiện tại', () => {
    const ctx = setup();
    recordLoop(ctx); // anchor 1.0
    ctx.advance(250); // vị trí 0,25
    act(() => ctx.looper().toggleOverdub());
    expect(ctx.looper().mode).toBe('overdubbing');
    act(() => ctx.looper().capture('hihat'));
    ctx.advance(2200);
    const hats = ctx.whens('hihat').map((w) => +w.toFixed(3));
    expect(hats.slice(0, 2)).toEqual([2.25, 3.25]);
    expect(hats).not.toContain(1.25);
    act(() => ctx.looper().toggleOverdub());
    expect(ctx.looper().mode).toBe('playing');
  });

  it('chỉ overdub được khi đang phát', () => {
    const ctx = setup();
    act(() => ctx.looper().toggleOverdub());
    expect(ctx.looper().mode).toBe('empty');
  });
});

describe('useLooper: tốc độ và Clear', () => {
  it('đổi tốc độ lúc đang chạy: giữ vị trí, các hit sau dày hơn theo tốc độ mới', () => {
    const ctx = setup();
    recordLoop(ctx); // anchor 1.0, kick vòng 2 ở loopT 1.0
    ctx.advance(500); // giờ 1.5, vị trí 0,5
    act(() => ctx.looper().setSpeed(2));
    expect(ctx.looper().speed).toBe(2);
    ctx.advance(600);
    // loopT 1.0 còn 0,5 giây vòng nữa => 0,25 giây thật => giờ 1.75 (tốc độ 1 sẽ là 2.0)
    expect(ctx.whens('kick').map((w) => +w.toFixed(3))).toContain(1.75);
    expect(ctx.whens('kick').map((w) => +w.toFixed(3))).not.toContain(2);
  });

  it('đổi tốc độ khi chưa phát: lần Play sau dùng tốc độ mới', () => {
    const ctx = setup();
    recordLoop(ctx);
    act(() => ctx.looper().togglePlay()); // ready
    act(() => ctx.looper().setSpeed(2));
    ctx.trigger.mockClear();
    const start = ctx.clock.t;
    act(() => ctx.looper().togglePlay());
    ctx.advance(600);
    expect(ctx.whens('snare')[0]).toBeCloseTo(start + 0.25);
  });

  it('Clear: về empty, xoá bản ghi, huỷ timer', () => {
    const ctx = setup();
    recordLoop(ctx);
    ctx.advance(100);
    act(() => ctx.looper().clear());
    expect(ctx.looper().mode).toBe('empty');
    expect(vi.getTimerCount()).toBe(0);
    ctx.trigger.mockClear();
    ctx.advance(2000);
    expect(ctx.trigger).not.toHaveBeenCalled();
  });
});

describe('useLooper: dọn dẹp', () => {
  it('unmount khi đang phát huỷ interval', () => {
    const ctx = setup();
    recordLoop(ctx);
    expect(vi.getTimerCount()).toBe(1);
    ctx.hook.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('StrictMode không nhân đôi interval: mỗi hit chỉ lên lịch một lần', () => {
    const ctx = setup({ wrapper: StrictMode });
    recordLoop(ctx);
    ctx.advance(1500);
    const kicks = ctx.whens('kick');
    expect(new Set(kicks).size).toBe(kicks.length);
    expect(vi.getTimerCount()).toBe(1);
  });
});
