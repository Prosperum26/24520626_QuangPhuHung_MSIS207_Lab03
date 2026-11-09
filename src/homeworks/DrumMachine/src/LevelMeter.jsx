import { useEffect, useId, useState } from 'react';
import { SILENCE_DB } from './audioEngine.js';
import { METER_INTERVAL_MS, METER_LEVELS, METER_SEGMENTS } from './drumPads.js';
import styles from './LevelMeter.module.css';

const SEGMENT_IDS = Array.from({ length: METER_SEGMENTS }, (_, n) => `seg-${n}`);

/** Chữ mô tả mức âm, để meter không chỉ dựa vào màu. */
export function levelLabel(db) {
  return METER_LEVELS.find((level) => db >= level.minDb)?.label ?? 'Im lặng';
}

// Dấu trừ thật (U+2212) cho số âm, dễ đọc hơn gạch nối.
const formatDb = (db) => (db < 0 ? `−${Math.abs(db)} dB` : `${db} dB`);

/**
 * Thanh mức âm cho người khiếm thính: đo âm thật từ AnalyserNode qua getLevelDb.
 * Đọc mỗi frame bằng requestAnimationFrame nhưng chỉ setState mỗi METER_INTERVAL_MS
 * và chỉ khi số làm tròn đổi (React bỏ qua setState cùng giá trị).
 * Không phải vùng live: số đổi liên tục, đọc ra sẽ thành tiếng ồn.
 * @param {{ getLevelDb: () => number }} props
 */
export function LevelMeter({ getLevelDb }) {
  const headingId = useId();
  const [db, setDb] = useState(SILENCE_DB);

  useEffect(() => {
    let frameId = 0;
    let lastUpdate = 0;
    const tick = (time) => {
      if (time - lastUpdate >= METER_INTERVAL_MS) {
        lastUpdate = time;
        setDb(Math.round(getLevelDb()));
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [getLevelDb]);

  const isSilent = db <= SILENCE_DB;
  const lit = Math.round(((db - SILENCE_DB) / -SILENCE_DB) * METER_SEGMENTS);

  return (
    <section aria-labelledby={headingId} className={styles.meter}>
      <h2 id={headingId}>Mức âm</h2>
      <p className={styles.readout}>
        {!isSilent && <span className={styles.value}>{formatDb(db)}</span>}
        <span className={styles.level}>{levelLabel(db)}</span>
      </p>
      <span className={styles.bar} aria-hidden="true">
        {SEGMENT_IDS.map((segment, n) => (
          <span key={segment} className={styles.segment} data-lit={n < lit} />
        ))}
      </span>
    </section>
  );
}
