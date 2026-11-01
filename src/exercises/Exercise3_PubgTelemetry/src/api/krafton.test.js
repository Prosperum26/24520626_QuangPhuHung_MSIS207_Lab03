import { describe, expect, it, vi } from 'vitest';
import { fetchKraftonPubgTelemetry } from './krafton.js';
import { SQUADS_BY_ID } from '../data/pubgSquads.js';

const steady = () => 0.99; // rng cố định, tất định

const okResponse = (squadId) => ({ ok: true, status: 200, json: async () => SQUADS_BY_ID.get(squadId) });
const failResponse = (status) => ({ ok: false, status, json: async () => ({}) });

// fetch giả: reject AbortError khi signal abort, giống fetch thật.
const hangingFetch = () =>
  vi.fn(
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        if (signal.aborted) reject(new DOMException('aborted', 'AbortError'));
        signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
      }),
  );

describe('fetchKraftonPubgTelemetry (E3-02, E3-10)', () => {
  it('gọi đúng URL của squad kèm signal (request mạng thật)', async () => {
    const fetchImpl = vi.fn(async () => okResponse('ces'));
    const controller = new AbortController();
    await fetchKraftonPubgTelemetry('ces', { signal: controller.signal, rng: steady, lossRate: 0, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith('/api/telemetry/ces', { signal: controller.signal });
  });

  it('lossRate 0: luôn thành công, trả đúng dữ liệu server', async () => {
    const fetchImpl = async () => okResponse('ge');
    await expect(fetchKraftonPubgTelemetry('ge', { rng: steady, lossRate: 0, fetchImpl })).resolves.toBe(SQUADS_BY_ID.get('ge'));
  });

  it('lossRate 1: luôn lỗi mất gói', async () => {
    const fetchImpl = async () => okResponse('te');
    await expect(fetchKraftonPubgTelemetry('te', { rng: steady, lossRate: 1, fetchImpl })).rejects.toThrow(
      'Satellite packet timeout',
    );
  });

  it('abort giữa chừng: reject AbortError', async () => {
    const controller = new AbortController();
    const fetchImpl = hangingFetch();
    const p = fetchKraftonPubgTelemetry('te', { signal: controller.signal, fetchImpl });
    const assertion = expect(p).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await assertion;
  });

  it('signal đã abort từ đầu: reject AbortError ngay', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      fetchKraftonPubgTelemetry('te', { signal: controller.signal, fetchImpl: hangingFetch() }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('404: lỗi squad không tồn tại; lỗi HTTP khác nêu mã', async () => {
    await expect(fetchKraftonPubgTelemetry('xx', { fetchImpl: async () => failResponse(404) })).rejects.toThrow(
      'Unknown squad: xx',
    );
    await expect(fetchKraftonPubgTelemetry('te', { fetchImpl: async () => failResponse(503) })).rejects.toThrow(
      'Telemetry HTTP 503',
    );
  });

  it('lỗi mạng của fetch được ném lại nguyên vẹn', async () => {
    const fetchImpl = async () => {
      throw new TypeError('Failed to fetch');
    };
    await expect(fetchKraftonPubgTelemetry('te', { fetchImpl })).rejects.toThrow('Failed to fetch');
  });
});
