import { useId } from 'react';
import { KITS } from './kits.js';
import styles from './Controls.module.css';

/**
 * Chọn bộ trống, âm lượng, tắt tiếng. Component thuần: state nằm ở useDrumAudio.
 * @param {{
 *   kit: string, onKitChange: (id: string) => void,
 *   volume: number, onVolumeChange: (value: number) => void,
 *   muted: boolean, onMutedChange: (value: boolean) => void,
 * }} props
 */
export function Controls({ kit, onKitChange, volume, onVolumeChange, muted, onMutedChange }) {
  const headingId = useId();
  const kitId = useId();
  const volumeId = useId();
  const mutedId = useId();

  return (
    <section aria-labelledby={headingId} className={styles.controls}>
      <h2 id={headingId}>Âm thanh</h2>

      <div className={styles.field}>
        <label htmlFor={kitId}>Bộ trống</label>
        <select id={kitId} value={kit} onChange={(e) => onKitChange(e.target.value)}>
          {KITS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor={volumeId}>Âm lượng</label>
        <span className={styles.row}>
          <input
            id={volumeId}
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const next = e.target.valueAsNumber;
              if (!Number.isNaN(next)) onVolumeChange(next);
            }}
          />
          <output htmlFor={volumeId} className={styles.value}>
            {Math.round(volume * 100)}%
          </output>
        </span>
      </div>

      <div className={styles.check}>
        <input id={mutedId} type="checkbox" checked={muted} onChange={(e) => onMutedChange(e.target.checked)} />
        <label htmlFor={mutedId}>Tắt tiếng</label>
      </div>
    </section>
  );
}
