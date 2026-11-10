import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { whenIdle } from './whenIdle.js';

function setReadyState(value) {
  Object.defineProperty(document, 'readyState', { value, configurable: true });
}

beforeEach(() => {
  vi.useFakeTimers();
  setReadyState('complete');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete document.readyState; // trả về getter gốc của prototype
});

describe('whenIdle', () => {
  it('không chạy đồng bộ; chạy sau một nhịp khi không có requestIdleCallback', () => {
    const fn = vi.fn();
    whenIdle(fn);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('huỷ trước khi chạy thì không chạy', () => {
    const fn = vi.fn();
    const cancel = whenIdle(fn);
    cancel();
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('dùng requestIdleCallback khi trình duyệt có, và huỷ bằng cancelIdleCallback', () => {
    const request = vi.fn(() => 42);
    const cancelIdle = vi.fn();
    vi.stubGlobal('requestIdleCallback', request);
    vi.stubGlobal('cancelIdleCallback', cancelIdle);
    const fn = vi.fn();
    const cancel = whenIdle(fn);
    expect(request).toHaveBeenCalledWith(fn);
    cancel();
    expect(cancelIdle).toHaveBeenCalledWith(42);
  });

  it('trang chưa tải xong thì đợi sự kiện load rồi mới lên lịch', () => {
    setReadyState('loading');
    const fn = vi.fn();
    whenIdle(fn);
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('load'));
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('huỷ trong lúc đợi load thì gỡ listener, load tới sau cũng không chạy', () => {
    setReadyState('loading');
    const fn = vi.fn();
    const cancel = whenIdle(fn);
    cancel();
    window.dispatchEvent(new Event('load'));
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
  });
});
