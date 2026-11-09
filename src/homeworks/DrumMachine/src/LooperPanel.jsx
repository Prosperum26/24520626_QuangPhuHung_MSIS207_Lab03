import { useId } from 'react';
import { LOOP_MODES, SPEED_MAX, SPEED_MIN, SPEED_STEP } from './looperConfig.js';
import styles from './LooperPanel.module.css';

const STATUS = {
  empty: 'Chưa có bản ghi. Bấm Ghi, gõ trống, rồi bấm Ghi lần nữa để dừng.',
  recording: 'Đang ghi. Gõ trống, xong thì bấm Ghi lần nữa.',
  playing: 'Đang lặp.',
  playingOnce: 'Đang phát một lần.',
  overdubbing: 'Đang chồng lớp. Gõ thêm để thêm vào vòng.',
  ready: 'Đã dừng. Bấm Phát để nghe lại.',
};

function statusText(mode, loopMode) {
  return mode === 'playing' && loopMode === 'once' ? STATUS.playingOnce : STATUS[mode];
}

/**
 * Bảng điều khiển looper. Component thuần: toàn bộ logic nằm ở useLooper.
 * Vùng role="status" luôn có trong DOM (không tạo lại mỗi lần đổi trạng thái) để trình đọc màn hình bắt được thay đổi.
 * @param {{ looper: ReturnType<typeof import('./useLooper.js').useLooper> }} props
 */
export function LooperPanel({ looper }) {
  const { mode, loopMode, setLoopMode, speed, setSpeed, progress } = looper;
  const headingId = useId();
  const modeName = useId();
  const speedId = useId();
  const progressId = useId();

  const isRunning = mode === 'playing' || mode === 'overdubbing';
  const canRecord = mode === 'empty' || mode === 'recording';

  return (
    <section aria-labelledby={headingId} className={styles.looper}>
      <h2 id={headingId}>Looper</h2>
      <p role="status" className={styles.status}>
        {statusText(mode, loopMode)}
      </p>

      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.button}
          data-tone="record"
          aria-pressed={mode === 'recording'}
          disabled={!canRecord}
          onClick={looper.record}
        >
          Ghi
        </button>
        <button type="button" className={styles.button} disabled={!(isRunning || mode === 'ready')} onClick={looper.togglePlay}>
          {isRunning ? 'Dừng' : 'Phát'}
        </button>
        <button
          type="button"
          className={styles.button}
          aria-pressed={mode === 'overdubbing'}
          disabled={!isRunning}
          onClick={looper.toggleOverdub}
        >
          Chồng lớp
        </button>
        <button type="button" className={styles.button} disabled={mode === 'empty'} onClick={looper.clear}>
          Xoá
        </button>
      </div>

      <div className={styles.progress}>
        <label htmlFor={progressId}>Vị trí trong vòng</label>
        <progress id={progressId} max={100} value={progress} />
      </div>

      <fieldset className={styles.modes}>
        <legend>Chế độ phát</legend>
        {LOOP_MODES.map((m) => {
          const id = `${modeName}-${m.id}`;
          return (
            <span key={m.id} className={styles.radio}>
              <input id={id} type="radio" name={modeName} value={m.id} checked={loopMode === m.id} onChange={() => setLoopMode(m.id)} />
              <label htmlFor={id}>{m.label}</label>
            </span>
          );
        })}
      </fieldset>

      <div className={styles.speed}>
        <label htmlFor={speedId}>Tốc độ</label>
        <span className={styles.row}>
          <input
            id={speedId}
            type="range"
            min={SPEED_MIN}
            max={SPEED_MAX}
            step={SPEED_STEP}
            value={speed}
            onChange={(e) => {
              const next = e.target.valueAsNumber;
              if (!Number.isNaN(next)) setSpeed(next);
            }}
          />
          {/* span, không phải <output>: <output> là vùng live ngầm, kéo thanh trượt sẽ bị đọc liên tục. */}
          <span className={styles.value}>{speed}×</span>
        </span>
      </div>
    </section>
  );
}
