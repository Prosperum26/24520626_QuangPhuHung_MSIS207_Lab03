import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePubgAirdropTimer } from './usePubgAirdropTimer.js';

const START = new Date('2026-01-01T00:00:00Z').getTime();

function setVisibility(state) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
});

afterEach(() => {
  setVisibility('visible');
  vi.useRealTimers();
});

describe('usePubgAirdropTimer', () => {
  it('trả remainingMs ban đầu và isLive=false trước giờ drop', () => {
    const { result } = renderHook(() => usePubgAirdropTimer(START + 10_000));
    expect(result.current).toEqual({ remainingMs: 10_000, isLive: false });
  });

  it('cập nhật theo nhịp 200ms', () => {
    const { result } = renderHook(() => usePubgAirdropTimer(START + 10_000));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.remainingMs).toBe(9000);
  });

  it('bù serverOffsetMs vào đồng hồ máy khách', () => {
    const { result } = renderHook(() => usePubgAirdropTimer(START + 10_000, 3000));
    expect(result.current.remainingMs).toBe(7000);
  });

  it('chặn ở 0 và isLive=true khi tới giờ hoặc đã quá giờ', () => {
    const { result } = renderHook(() => usePubgAirdropTimer(START + 1000));
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current).toEqual({ remainingMs: 0, isLive: true });
  });

  it('tab nền 1 phút: interval bị throttle nhưng khi visible giá trị đúng ngay', () => {
    const { result } = renderHook(() => usePubgAirdropTimer(START + 120_000));
    act(() => setVisibility('hidden'));
    // Mô phỏng Chrome throttle: đồng hồ thật đi 60s mà không có tick nào chạy.
    vi.setSystemTime(START + 60_000);
    expect(result.current.remainingMs).toBe(120_000);
    act(() => setVisibility('visible'));
    expect(result.current.remainingMs).toBe(60_000);
  });

  it('visibilitychange sang hidden thì không đọc lại đồng hồ', () => {
    const { result } = renderHook(() => usePubgAirdropTimer(START + 120_000));
    vi.setSystemTime(START + 60_000);
    act(() => setVisibility('hidden'));
    expect(result.current.remainingMs).toBe(120_000);
  });
});

describe('usePubgAirdropTimer cleanup', () => {
  it('unmount gỡ interval và listener visibilitychange', () => {
    const clearSpy = vi.spyOn(window, 'clearInterval');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => usePubgAirdropTimer(START + 10_000));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('StrictMode (mount-unmount-mount) chỉ còn đúng một interval', () => {
    const { result, unmount } = renderHook(() => usePubgAirdropTimer(START + 10_000), { reactStrictMode: true });
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.remainingMs).toBe(9000);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('đổi targetEpochMs thì gỡ interval cũ và tính lại ngay theo mục tiêu mới', () => {
    const { result, rerender } = renderHook(({ target }) => usePubgAirdropTimer(target), {
      initialProps: { target: START + 10_000 },
    });
    rerender({ target: START + 60_000 });
    expect(vi.getTimerCount()).toBe(1);
    expect(result.current.remainingMs).toBe(60_000);
  });
});
