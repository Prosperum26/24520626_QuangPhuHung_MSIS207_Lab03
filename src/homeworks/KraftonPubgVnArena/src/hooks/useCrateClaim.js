import { useEffect, useRef, useState } from 'react';

export const LOOTED_OUT_ERROR = 'Crate đã bị lấy hết. Suất của bạn không được giữ.';
export const NETWORK_ERROR = 'Không kết nối được máy chủ. Hãy thử lại.';

/**
 * Claim lạc quan cho một crate.
 * - Khoá chống bấm đúp là `inFlightClaimId` trong useRef: đọc/ghi tức thì, không cần render.
 * - Trừ kho ngay khi bấm; 200 thì đối chiếu kho server; 409 thì cộng lại đúng phần đã trừ
 *   (cập nhật theo delta, không ghi lại snapshot cũ nên không đè trạng thái mới hơn).
 * @param {object} options
 * @param {string} options.crateId
 * @param {number} options.initialStock
 * @param {(crateId: string, options: { signal: AbortSignal }) => Promise<import('../api/arena.js').ReserveResult>} options.reserveCrate
 * @returns {{ stock: number, status: 'idle' | 'pending' | 'claimed' | 'failed', error: string, claim: () => Promise<void> }}
 */
export function useCrateClaim({ crateId, initialStock, reserveCrate }) {
  const [stock, setStock] = useState(initialStock);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const inFlightClaimId = useRef(null);
  const stockRef = useRef(initialStock);
  const claimCounter = useRef(0);
  const controllerRef = useRef(null);

  // Mỗi lần đổi kho đều qua đây để stockRef (dùng cho guard trong handler) luôn khớp state.
  const applyStock = (updater) => {
    stockRef.current = updater(stockRef.current);
    setStock(stockRef.current);
  };

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  async function claim() {
    if (inFlightClaimId.current !== null) return;
    if (stockRef.current <= 0) return;

    claimCounter.current += 1;
    const claimId = `${crateId}-${claimCounter.current}`;
    inFlightClaimId.current = claimId;
    const controller = new AbortController();
    controllerRef.current = controller;

    applyStock((s) => s - 1);
    setStatus('pending');
    setError('');

    try {
      const result = await reserveCrate(crateId, { signal: controller.signal });
      if (inFlightClaimId.current !== claimId) return;
      if (result.status === 200) {
        applyStock(() => result.remainingStock);
        setStatus('claimed');
      } else {
        applyStock((s) => s + 1);
        setStatus('failed');
        setError(LOOTED_OUT_ERROR);
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      if (inFlightClaimId.current !== claimId) return;
      applyStock((s) => s + 1);
      setStatus('failed');
      setError(NETWORK_ERROR);
    } finally {
      if (inFlightClaimId.current === claimId) inFlightClaimId.current = null;
    }
  }

  return { stock, status, error, claim };
}
