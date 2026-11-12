import { useEffect, useState } from 'react';

/**
 * Đếm ngược tới `targetEpochMs`, không trôi khi tab nền bị throttle:
 * luôn tính lại từ mốc tuyệt đối (không bao giờ `s - 1`), mỗi 200ms
 * và ngay khi tab quay lại `visible`.
 * @param {number} targetEpochMs
 * @param {number} [serverOffsetMs] lệch đồng hồ máy khách so với server
 * @returns {{ remainingMs: number, isLive: boolean }}
 */
export function usePubgAirdropTimer(targetEpochMs, serverOffsetMs = 0) {
  const calcRemaining = () => Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs));

  const [remainingMs, setRemainingMs] = useState(calcRemaining);

  useEffect(() => {
    const calc = () => Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs));
    const syncClock = () => setRemainingMs(calc());
    syncClock();
    const timerId = window.setInterval(syncClock, 200);
    const onWake = () => {
      if (document.visibilityState === 'visible') syncClock();
    };
    document.addEventListener('visibilitychange', onWake);
    return () => {
      window.clearInterval(timerId);
      document.removeEventListener('visibilitychange', onWake);
    };
  }, [targetEpochMs, serverOffsetMs]);

  return { remainingMs, isLive: remainingMs === 0 };
}
