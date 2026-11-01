import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTelemetryHandler } from './telemetryPlugin.js';
import { SQUADS_BY_ID } from '../src/data/pubgSquads.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const makeRes = () => {
  const res = new EventEmitter();
  res.headers = {};
  res.statusCode = 200;
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.end = vi.fn();
  return res;
};

describe('createTelemetryHandler (E3-10)', () => {
  it('trả JSON đúng squad sau 800-1200ms, không trả sớm', async () => {
    const handler = createTelemetryHandler({ rng: () => 0 });
    const res = makeRes();
    handler({ url: '/te' }, res);
    await vi.advanceTimersByTimeAsync(799);
    expect(res.end).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(res.end).toHaveBeenCalledWith(JSON.stringify(SQUADS_BY_ID.get('te')));
    expect(res.headers['Content-Type']).toBe('application/json');
  });

  it('squad không tồn tại: 404', async () => {
    const res = makeRes();
    createTelemetryHandler({ rng: () => 0 })({ url: '/xx' }, res);
    await vi.runAllTimersAsync();
    expect(res.statusCode).toBe(404);
  });

  it('client ngắt kết nối: dừng timer, không ghi phản hồi', async () => {
    const res = makeRes();
    createTelemetryHandler({ rng: () => 0.5 })({ url: '/ces' }, res);
    expect(vi.getTimerCount()).toBe(1);
    res.emit('close');
    expect(vi.getTimerCount()).toBe(0);
    await vi.runAllTimersAsync();
    expect(res.end).not.toHaveBeenCalled();
  });
});
