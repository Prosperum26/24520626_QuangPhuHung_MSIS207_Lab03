import { useId } from 'react';
import { SPEEDS } from '../pianoConfig.js';
import { formatSpeed } from '../useSequencer.js';
import styles from './Sequencer.module.css';

/**
 * Bảng điều khiển ghi và phát lại, thuần hiển thị (trạng thái nằm trong useSequencer).
 * Vùng role="status" luôn có trong DOM (không tạo lại mỗi lần đổi trạng thái) để trình đọc màn hình
 * bắt được thay đổi. Nút "Ghi" là nút bật/tắt: nhãn cố định, trạng thái ở aria-pressed.
 * @param {{
 *   status: 'idle' | 'recording' | 'playing', count: number, speed: number, message: string,
 *   onRecord: () => void, onStopRecord: () => void, onPlay: () => void, onStop: () => void,
 *   onSpeedChange: (speed: number) => void,
 * }} props
 */
export function Sequencer({ status, count, speed, message, onRecord, onStopRecord, onPlay, onStop, onSpeedChange }) {
  const headingId = useId();
  const speedName = useId();
  const isRecording = status === 'recording';
  const isPlaying = status === 'playing';

  return (
    <section aria-labelledby={headingId} className={styles.sequencer}>
      <h2 id={headingId}>Ghi và phát lại</h2>
      <p role="status" className={styles.status}>
        {message}
      </p>

      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.button}
          aria-pressed={isRecording}
          disabled={isPlaying}
          onClick={isRecording ? onStopRecord : onRecord}
        >
          Ghi
        </button>
        <button type="button" className={styles.button} disabled={count === 0 || status !== 'idle'} onClick={onPlay}>
          Phát
        </button>
        <button type="button" className={styles.button} disabled={!isPlaying} onClick={onStop}>
          Dừng
        </button>
      </div>

      <fieldset className={styles.speeds} disabled={isPlaying}>
        <legend>Tốc độ phát</legend>
        {SPEEDS.map((value) => {
          const id = `${speedName}-${value}`;
          return (
            <span key={value} className={styles.radio}>
              <input
                id={id}
                type="radio"
                name={speedName}
                value={value}
                checked={speed === value}
                onChange={() => onSpeedChange(value)}
              />
              <label htmlFor={id}>{formatSpeed(value)}</label>
            </span>
          );
        })}
      </fieldset>
    </section>
  );
}
