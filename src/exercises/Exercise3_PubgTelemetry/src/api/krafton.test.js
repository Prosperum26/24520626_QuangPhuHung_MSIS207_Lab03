import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchKraftonPubgTelemetry } from './krafton.js';
import { SQUADS_BY_ID } from '../data/pubgSquads.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const steady = () => 0.99; // rng cố định, tất định

describe('fetchKraftonPubgTelemetry (E3-02)', () => {
  it('lossRate 0: luôn thành công với đúng squad', async () => {
    const p = fetchKraftonPubgTelemetry('ces', { rng: steady, lossRate: 0 });
    await vi.runAllTimersAsync();
    await expect(p).resolves.toBe(SQUADS_BY_ID.get('ces'));
  });

  it('lossRate 1: luôn lỗi mất gói', async () => {
    const p = fetchKraftonPubgTelemetry('te', { rng: steady, lossRate: 1 });
    const assertion = expect(p).rejects.toThrow('Satellite packet timeout');
    await vi.runAllTimersAsync();
    await assertion;
  });

  it('trễ nằm trong 800-1200ms theo rng', async () => {
    const early = vi.fn();
    fetchKraftonPubgTelemetry('te', { rng: () => 0, lossRate: 0 }).then(early);
    await vi.advanceTimersByTimeAsync(799);
    expect(early).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(early).toHaveBeenCalledTimes(1);

    const late = vi.fn();
    fetchKraftonPubgTelemetry('te', { rng: () => 0.999999, lossRate: 0 }).then(late);
    await vi.advanceTimersByTimeAsync(1198);
    expect(late).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2); // timer làm tròn xuống ms
    expect(late).toHaveBeenCalledTimes(1);
  });

  it('abort giữa chừng: reject AbortError ngay và không còn timer treo', async () => {
    const controller = new AbortController();
    const p = fetchKraftonPubgTelemetry('ge', { signal: controller.signal, rng: steady, lossRate: 0 });
    const assertion = expect(p).rejects.toMatchObject({ name: 'AbortError' });
    expect(vi.getTimerCount()).toBe(1);
    controller.abort();
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('signal đã abort từ đầu: reject ngay, không đặt timer', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(fetchKraftonPubgTelemetry('te', { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('settle xong thì gỡ listener abort', async () => {
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, 'removeEventListener');
    const p = fetchKraftonPubgTelemetry('te', { signal: controller.signal, rng: steady, lossRate: 0 });
    await vi.runAllTimersAsync();
    await p;
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
    controller.abort();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('squad không tồn tại: reject lỗi rõ ràng', async () => {
    const p = fetchKraftonPubgTelemetry('xx', { rng: steady, lossRate: 0 });
    const assertion = expect(p).rejects.toThrow('Unknown squad: xx');
    await vi.runAllTimersAsync();
    await assertion;
  });
});
