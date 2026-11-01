import { LATENCY_MAX_MS, LATENCY_MIN_MS, LOSS_RATE } from '../config/telemetry.js';
import { SQUADS_BY_ID } from '../data/pubgSquads.js';

const abortError = () => new DOMException('Telemetry request aborted', 'AbortError');

/**
 * Giả lập gọi vệ tinh KRAFTON: có trễ, có mất gói, huỷ được bằng AbortSignal.
 * rng/latencyMs/lossRate tiêm được để test tất định.
 * Không rò: timer bị clearTimeout khi abort; listener abort được gỡ khi settle.
 *
 * @param {string} squadId
 * @param {{ signal?: AbortSignal, rng?: () => number, latencyMs?: number, lossRate?: number }} [opts]
 * @returns {Promise<import('../data/pubgSquads.js').Squad>}
 */
export function fetchKraftonPubgTelemetry(
  squadId,
  { signal, rng = Math.random, latencyMs, lossRate = LOSS_RATE } = {},
) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const delay = latencyMs ?? LATENCY_MIN_MS + rng() * (LATENCY_MAX_MS - LATENCY_MIN_MS);

    const onAbort = () => {
      clearTimeout(timerId);
      reject(abortError());
    };

    const timerId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      const squad = SQUADS_BY_ID.get(squadId);
      if (rng() < lossRate) {
        reject(new Error('Satellite packet timeout'));
      } else if (!squad) {
        reject(new Error(`Unknown squad: ${squadId}`));
      } else {
        resolve(squad);
      }
    }, delay);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
