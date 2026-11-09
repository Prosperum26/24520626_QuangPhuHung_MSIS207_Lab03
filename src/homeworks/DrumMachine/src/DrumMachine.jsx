import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ACTIVE_MS, PADS, padMap } from './drumPads.js';
import { Pad } from './Pad.jsx';
import { useDrumAudio } from './useDrumAudio.js';
import { useDrumKeyboard } from './useDrumKeyboard.js';
import styles from './DrumMachine.module.css';

/**
 * Ghép bàn phím, âm thanh và các pad. Mọi nguồn kích hoạt (phím, chuột, chạm) đi qua một
 * handleTrigger duy nhất, nên âm thanh và trạng thái sáng luôn khớp nhau.
 */
export function DrumMachine() {
  const { trigger, error } = useDrumAudio();
  const [activeIds, setActiveIds] = useState(() => new Set());
  const timersRef = useRef(new Map()); // padId -> id của timer tắt sáng

  const handleTrigger = useCallback(
    (padId) => {
      trigger(padId);

      // Hit lại khi đang sáng: huỷ timer cũ để thời hạn tính lại từ lần này.
      clearTimeout(timersRef.current.get(padId));
      setActiveIds((prev) => new Set(prev).add(padId));
      timersRef.current.set(
        padId,
        setTimeout(() => {
          timersRef.current.delete(padId);
          setActiveIds((prev) => {
            const next = new Set(prev);
            next.delete(padId);
            return next;
          });
        }, ACTIVE_MS),
      );
    },
    [trigger],
  );

  useDrumKeyboard(padMap, handleTrigger);

  // Unmount: huỷ mọi timer còn chờ để không setState sau khi component đã gỡ.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={styles.machine}>
      <h2 id={headingId}>Pads</h2>
      {error !== null && <p role="alert">{error}</p>}
      <ul className={styles.grid}>
        {PADS.map((pad) => (
          <li key={pad.id}>
            <Pad pad={pad} isActive={activeIds.has(pad.id)} onTrigger={handleTrigger} />
          </li>
        ))}
      </ul>
    </section>
  );
}
