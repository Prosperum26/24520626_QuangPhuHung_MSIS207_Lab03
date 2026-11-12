import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { LOOTED_OUT_ERROR, NETWORK_ERROR, useCrateClaim } from './useCrateClaim.js';

/** Promise điều khiển tay để kiểm tra trạng thái "đang bay". */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(initialStock, reserveCrate) {
  return renderHook(() => useCrateClaim({ crateId: 'a', initialStock, reserveCrate }));
}

describe('useCrateClaim: claim lạc quan và khoá claimId (H3-05)', () => {
  it('trừ kho ngay lập tức, trước khi server trả lời', () => {
    const d = deferred();
    const { result } = setup(3, vi.fn(() => d.promise));
    act(() => { result.current.claim(); });
    expect(result.current.stock).toBe(2);
    expect(result.current.status).toBe('pending');
  });

  it('hai click liên tiếp chỉ gửi một request và chỉ trừ một lần', () => {
    const d = deferred();
    const reserveCrate = vi.fn(() => d.promise);
    const { result } = setup(3, reserveCrate);
    act(() => {
      result.current.claim();
      result.current.claim();
    });
    expect(reserveCrate).toHaveBeenCalledTimes(1);
    expect(result.current.stock).toBe(2);
  });

  it('200: đối chiếu kho theo server, status claimed, mở khoá cho lần sau', async () => {
    const reserveCrate = vi.fn().mockResolvedValue({ status: 200, remainingStock: 1 });
    const { result } = setup(3, reserveCrate);
    await act(() => result.current.claim());
    expect(result.current.stock).toBe(1);
    expect(result.current.status).toBe('claimed');
    await act(() => result.current.claim());
    expect(reserveCrate).toHaveBeenCalledTimes(2);
  });

  it('kho bằng 0 thì không gửi request', async () => {
    const reserveCrate = vi.fn();
    const { result } = setup(0, reserveCrate);
    await act(() => result.current.claim());
    expect(reserveCrate).not.toHaveBeenCalled();
    expect(result.current.stock).toBe(0);
  });

  it('truyền AbortSignal và abort khi unmount, không cập nhật state sau đó', async () => {
    const d = deferred();
    let signal;
    const reserveCrate = vi.fn((_id, options) => {
      signal = options.signal;
      return d.promise;
    });
    const { result, unmount } = setup(3, reserveCrate);
    act(() => { result.current.claim(); });
    unmount();
    expect(signal.aborted).toBe(true);
    d.reject(new DOMException('aborted', 'AbortError'));
    await Promise.resolve();
  });
});

describe('useCrateClaim: rollback khi 409 (H3-06)', () => {
  it('409: kho trở lại giá trị cũ, có thông báo bằng chữ', async () => {
    const reserveCrate = vi.fn().mockResolvedValue({ status: 409, message: 'Looted Out' });
    const { result } = setup(1, reserveCrate);
    await act(() => result.current.claim());
    expect(result.current.stock).toBe(1);
    expect(result.current.status).toBe('failed');
    expect(result.current.error).toBe(LOOTED_OUT_ERROR);
  });

  it('trong lúc chờ 409 kho đã giảm (lạc quan), sau đó mới hoàn lại', async () => {
    const d = deferred();
    const { result } = setup(1, vi.fn(() => d.promise));
    act(() => { result.current.claim(); });
    expect(result.current.stock).toBe(0);
    await act(async () => d.resolve({ status: 409, message: 'Looted Out' }));
    expect(result.current.stock).toBe(1);
  });

  it('lỗi mạng cũng rollback và báo bằng chữ', async () => {
    const reserveCrate = vi.fn().mockRejectedValue(new Error('network down'));
    const { result } = setup(2, reserveCrate);
    await act(() => result.current.claim());
    expect(result.current.stock).toBe(2);
    expect(result.current.error).toBe(NETWORK_ERROR);
  });

  it('thử lại sau 409: khoá đã mở và lỗi cũ được xoá', async () => {
    const reserveCrate = vi
      .fn()
      .mockResolvedValueOnce({ status: 409, message: 'Looted Out' })
      .mockResolvedValueOnce({ status: 200, remainingStock: 0 });
    const { result } = setup(1, reserveCrate);
    await act(() => result.current.claim());
    await act(() => result.current.claim());
    expect(result.current.error).toBe('');
    expect(result.current.status).toBe('claimed');
    expect(result.current.stock).toBe(0);
  });
});
