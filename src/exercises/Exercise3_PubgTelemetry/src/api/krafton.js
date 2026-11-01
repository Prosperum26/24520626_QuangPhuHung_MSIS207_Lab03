import { LOSS_RATE, TELEMETRY_URL } from '../config/telemetry.js';

/**
 * Gọi vệ tinh KRAFTON bằng request mạng thật (DevTools Network thấy được, huỷ thì hiện "(canceled)").
 * Độ trễ do server (server/telemetryPlugin.js) tạo ra; mất gói 35% giả lập ở đây sau khi có phản hồi.
 * fetch tự reject AbortError khi signal abort (kể cả abort từ trước), nên không cần timer/listener tay.
 * rng/lossRate/fetchImpl tiêm được để test tất định.
 *
 * @param {string} squadId
 * @param {{ signal?: AbortSignal, rng?: () => number, lossRate?: number, fetchImpl?: typeof fetch }} [opts]
 * @returns {Promise<import('../data/pubgSquads.js').Squad>}
 */
export async function fetchKraftonPubgTelemetry(
  squadId,
  { signal, rng = Math.random, lossRate = LOSS_RATE, fetchImpl = globalThis.fetch } = {},
) {
  const response = await fetchImpl(`${TELEMETRY_URL}/${encodeURIComponent(squadId)}`, { signal });
  if (!response.ok) {
    throw new Error(response.status === 404 ? `Unknown squad: ${squadId}` : `Telemetry HTTP ${response.status}`);
  }
  const squad = await response.json();
  if (rng() < lossRate) throw new Error('Satellite packet timeout');
  return squad;
}
