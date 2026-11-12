/**
 * API giả cho claim crate. Server giữ kho "thật"; client chỉ thấy kho qua phản hồi.
 * - 200: giữ chỗ thành công, trả kho còn lại.
 * - 409: "Looted Out" (hết hàng, hoặc đối thủ nhanh tay hơn).
 * Tiêm được latency và rng để test tất định; tôn trọng AbortSignal.
 */

/** @typedef {{ status: 200, remainingStock: number } | { status: 409, message: string }} ReserveResult */

export const LOOTED_OUT_MESSAGE = 'Looted Out';

function abortError() {
  return new DOMException('The request was aborted.', 'AbortError');
}

/**
 * @param {object} options
 * @param {Record<string, number>} options.stock  kho ban đầu theo crateId
 * @param {number} [options.latencyMs]
 * @param {number} [options.rivalChance]  xác suất (0..1) một người chơi khác lấy suất trước
 * @param {() => number} [options.rng]
 */
export function createArenaApi({ stock, latencyMs = 400, rivalChance = 0, rng = Math.random }) {
  const serverStock = { ...stock };

  /**
   * @param {string} crateId
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<ReserveResult>}
   */
  function reserveCrate(crateId, { signal } = {}) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(abortError());
        return;
      }

      const onAbort = () => {
        clearTimeout(timerId);
        reject(abortError());
      };

      const timerId = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        const available = serverStock[crateId] ?? 0;
        const rivalFirst = rng() < rivalChance;
        if (rivalFirst && available > 0) serverStock[crateId] = available - 1;

        if ((serverStock[crateId] ?? 0) <= 0) {
          resolve({ status: 409, message: LOOTED_OUT_MESSAGE });
          return;
        }
        serverStock[crateId] -= 1;
        resolve({ status: 200, remainingStock: serverStock[crateId] });
      }, latencyMs);

      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }

  /** @param {string} crateId */
  const getServerStock = (crateId) => serverStock[crateId] ?? 0;

  return { reserveCrate, getServerStock };
}
