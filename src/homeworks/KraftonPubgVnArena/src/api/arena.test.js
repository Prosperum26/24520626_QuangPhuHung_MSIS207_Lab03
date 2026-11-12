import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createArenaApi } from './arena.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('reserveCrate', () => {
  it('trả 200 và giảm kho server sau latency', async () => {
    const api = createArenaApi({ stock: { a: 3 }, latencyMs: 300 });
    const promise = api.reserveCrate('a');
    expect(api.getServerStock('a')).toBe(3);
    await vi.advanceTimersByTimeAsync(300);
    await expect(promise).resolves.toEqual({ status: 200, remainingStock: 2 });
    expect(api.getServerStock('a')).toBe(2);
  });

  it('trả 409 Looted Out khi kho server đã hết', async () => {
    const api = createArenaApi({ stock: { a: 0 }, latencyMs: 100 });
    const promise = api.reserveCrate('a');
    await vi.advanceTimersByTimeAsync(100);
    await expect(promise).resolves.toEqual({ status: 409, message: 'Looted Out' });
  });

  it('crate không tồn tại cũng là 409', async () => {
    const api = createArenaApi({ stock: {}, latencyMs: 10 });
    const promise = api.reserveCrate('zzz');
    await vi.advanceTimersByTimeAsync(10);
    await expect(promise).resolves.toMatchObject({ status: 409 });
  });

  it('đối thủ lấy suất cuối trước (rng tiêm vào) thì 409 dù client thấy còn hàng', async () => {
    const api = createArenaApi({ stock: { a: 1 }, latencyMs: 100, rivalChance: 1, rng: () => 0 });
    const promise = api.reserveCrate('a');
    await vi.advanceTimersByTimeAsync(100);
    await expect(promise).resolves.toMatchObject({ status: 409 });
    expect(api.getServerStock('a')).toBe(0);
  });

  it('rng không rơi vào rivalChance thì không có đối thủ', async () => {
    const api = createArenaApi({ stock: { a: 1 }, latencyMs: 100, rivalChance: 0.5, rng: () => 0.9 });
    const promise = api.reserveCrate('a');
    await vi.advanceTimersByTimeAsync(100);
    await expect(promise).resolves.toMatchObject({ status: 200, remainingStock: 0 });
  });

  it('hai yêu cầu cho suất cuối: một 200, một 409', async () => {
    const api = createArenaApi({ stock: { a: 1 }, latencyMs: 100 });
    const first = api.reserveCrate('a');
    const second = api.reserveCrate('a');
    await vi.advanceTimersByTimeAsync(100);
    const results = await Promise.all([first, second]);
    expect(results.map((r) => r.status).toSorted()).toEqual([200, 409]);
  });
});

describe('reserveCrate abort', () => {
  it('abort giữa chừng reject AbortError và không trừ kho', async () => {
    const api = createArenaApi({ stock: { a: 2 }, latencyMs: 300 });
    const controller = new AbortController();
    const promise = api.reserveCrate('a', { signal: controller.signal });
    const assertion = expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await assertion;
    await vi.advanceTimersByTimeAsync(1000);
    expect(api.getServerStock('a')).toBe(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('signal đã abort sẵn thì reject ngay, không đặt timer', async () => {
    const api = createArenaApi({ stock: { a: 2 } });
    const controller = new AbortController();
    controller.abort();
    await expect(api.reserveCrate('a', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(vi.getTimerCount()).toBe(0);
  });
});
