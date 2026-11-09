import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ACTIVE_MS, LOG_MAX, PADS, padMap } from './drumPads.js';
import { HitLog } from './HitLog.jsx';
import { Pad } from './Pad.jsx';
import { useDrumAudio } from './useDrumAudio.js';
import { useDrumKeyboard } from './useDrumKeyboard.js';
import styles from './DrumMachine.module.css';

/**
 * Ghép bàn phím, âm thanh, pad và nhật ký. Mọi nguồn kích hoạt (phím, chuột, chạm) đi qua một
 * handleTrigger duy nhất, nên âm thanh, trạng thái sáng và nhật ký luôn khớp nhau.
 */
export function DrumMachine() {
  const { trigger, error } = useDrumAudio();
  const [activeIds, setActiveIds] = useState(() => new Set());
  const timersRef = useRef(new Map()); // padId -> id của timer tắt sáng
  const [hits, setHits] = useState([]); // mới nhất trước, tối đa LOG_MAX
  const hitSeqRef = useRef(0); // id tăng dần cho mỗi hit, dùng làm key

  const handleTrigger = useCallback(
    (padId) => {
      trigger(padId);

      hitSeqRef.current += 1;
      const hit = { id: hitSeqRef.current, padId };
      setHits((prev) => [hit, ...prev].slice(0, LOG_MAX));

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
    <div className={styles.studio}>
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
      <HitLog hits={hits} />
    </div>
  );
}
