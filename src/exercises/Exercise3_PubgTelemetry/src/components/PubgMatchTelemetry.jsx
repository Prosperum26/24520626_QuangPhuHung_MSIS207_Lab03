import { Fragment, memo, useEffect, useRef, useState } from 'react';
import { fetchKraftonPubgTelemetry } from '../api/krafton.js';
import { DEFAULT_SQUAD_ID, POLL_MS } from '../config/telemetry.js';
import { PUBG_VN_SQUADS } from '../data/pubgSquads.js';
import styles from './PubgMatchTelemetry.module.css';

/**
 * @typedef {'IDLE'|'LOADING'|'SUCCESS'|'ERROR'} Status
 * @typedef {{ status: Status, data: import('../data/pubgSquads.js').Squad | null, error: string | null,
 *   updatedAt: number | null, stale: boolean }} ViewState
 * `stale`: lần poll gần nhất lỗi, vẫn giữ dữ liệu cũ trên màn hình.
 */

const IDLE_VIEW = Object.freeze({ status: 'IDLE', data: null, error: null, updatedAt: null, stale: false });
const LOADING_VIEW = Object.freeze({ status: 'LOADING', data: null, error: null, updatedAt: null, stale: false });

const successView = (data, updatedAt) => ({ status: 'SUCCESS', data, error: null, updatedAt, stale: false });

const timeFormat = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function statusText({ status, updatedAt, stale }) {
  if (status === 'IDLE') return 'Radar chờ kết nối';
  if (status === 'LOADING') return 'Đang đồng bộ radar KRAFTON...';
  if (status === 'ERROR') return 'Mất tín hiệu vệ tinh';
  if (stale) return 'Tín hiệu yếu, đang giữ dữ liệu cũ';
  return `Radar cập nhật lúc ${timeFormat.format(updatedAt)}`;
}

// Tách khỏi component cha để đổi trạng thái tải không dựng lại phần chọn squad.
const SquadPicker = memo(function SquadPicker({ squadId, onSelect }) {
  return (
    <fieldset className={styles.picker}>
      <legend>Chọn squad</legend>
      {PUBG_VN_SQUADS.map((squad) => (
        <button
          key={squad.id}
          type="button"
          className={styles.pick}
          aria-pressed={squad.id === squadId}
          onClick={() => onSelect(squad.id)}
        >
          {squad.name}
        </button>
      ))}
    </fieldset>
  );
});

function TelemetrySkeleton() {
  return (
    <section className={styles.skeleton} aria-busy="true" aria-label="Đang tải telemetry">
      Syncing KRAFTON Radar...
    </section>
  );
}

function TelemetryView({ squad }) {
  const rows = [
    ['Map', squad.map],
    ['Phase', squad.phase],
    ['Alive', squad.alive],
    ['Kills', squad.kills],
    ['WWCD', squad.wwcdProb],
    ['Status', squad.status],
  ];
  return (
    <article className={styles.card} aria-labelledby={`squad-${squad.id}`}>
      <h2 id={`squad-${squad.id}`}>{squad.name}</h2>
      <dl className={styles.stats}>
        {rows.map(([label, value]) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </dl>
    </article>
  );
}

function TelemetryError({ message, onRetry }) {
  return (
    <section className={styles.alert} role="alert">
      <p>Blue-Zone Link Lost: {message}</p>
      <button type="button" className={styles.retry} onClick={onRetry}>
        Reconnect Satellite (Retry)
      </button>
    </section>
  );
}

/**
 * Radar telemetry cho squad PUBG VN. `squadId` chỉ là squad ban đầu; bộ chọn bên trong đổi squad.
 * @param {{ squadId?: string }} props
 */
export function PubgMatchTelemetry({ squadId: initialSquadId = DEFAULT_SQUAD_ID }) {
  const [squadId, setSquadId] = useState(initialSquadId);
  const [view, setView] = useState(IDLE_VIEW);
  const [retryTick, setRetryTick] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  // Kết quả thành công gần nhất theo squad ({ data, updatedAt }): quay lại squad cũ không nháy skeleton.
  const cacheRef = useRef(new Map());

  useEffect(() => {
    const cached = cacheRef.current.get(squadId);
    if (cached) {
      setView(successView(cached.data, cached.updatedAt));
      return undefined;
    }

    const controller = new AbortController();
    setView(LOADING_VIEW);

    fetchKraftonPubgTelemetry(squadId, { signal: controller.signal })
      .then((squad) => {
        // Lớp bảo vệ thứ hai: kết quả muộn của request đã bị huỷ không được ghi đè.
        if (controller.signal.aborted) return;
        const updatedAt = Date.now();
        cacheRef.current.set(squadId, { data: squad, updatedAt });
        setView(successView(squad, updatedAt));
      })
      .catch((err) => {
        // Đổi squad nhanh sinh AbortError: là chủ đích, không phải lỗi mạng.
        if (err.name === 'AbortError' || controller.signal.aborted) return;
        setView({ status: 'ERROR', data: null, error: err.message, updatedAt: null, stale: false });
      });

    return () => controller.abort();
  }, [squadId, retryTick]);

  // Polling: làm mới ngầm, giữ dữ liệu cũ trên màn hình (không quay lại skeleton). Một interval
  // cho mỗi (squadId, isPaused); cleanup dừng interval và huỷ request đang bay.
  useEffect(() => {
    if (isPaused) return undefined;

    let inflight = null;
    const timerId = setInterval(() => {
      // Tab ẩn hoặc request trước chưa xong thì bỏ qua nhịp này.
      if (document.hidden || inflight) return;
      const controller = new AbortController();
      inflight = controller;

      fetchKraftonPubgTelemetry(squadId, { signal: controller.signal })
        .then((squad) => {
          if (controller.signal.aborted) return;
          const updatedAt = Date.now();
          cacheRef.current.set(squadId, { data: squad, updatedAt });
          setView(successView(squad, updatedAt));
        })
        .catch((err) => {
          if (err.name === 'AbortError' || controller.signal.aborted) return;
          // Mất gói khi poll không phải lỗi nghiêm trọng: giữ dữ liệu cũ, chỉ báo tín hiệu yếu.
          setView((prev) => (prev.status === 'SUCCESS' ? { ...prev, stale: true } : prev));
        })
        .finally(() => {
          if (inflight === controller) inflight = null;
        });
    }, POLL_MS);

    return () => {
      clearInterval(timerId);
      inflight?.abort();
    };
  }, [squadId, isPaused]);

  return (
    <section className={styles.radar} aria-label="PUBG VN live radar">
      <SquadPicker squadId={squadId} onSelect={setSquadId} />
      <p className={styles.bar}>
        <output className={styles.status} aria-live="polite">
          {statusText(view)}
        </output>
        <button type="button" className={styles.pause} onClick={() => setIsPaused((paused) => !paused)}>
          {isPaused ? 'Resume Radar' : 'Pause Radar'}
        </button>
      </p>
      {view.status === 'SUCCESS' && <TelemetryView squad={view.data} />}
      {view.status === 'ERROR' && (
        <TelemetryError message={view.error} onRetry={() => setRetryTick((tick) => tick + 1)} />
      )}
      {(view.status === 'IDLE' || view.status === 'LOADING') && <TelemetrySkeleton />}
    </section>
  );
}
