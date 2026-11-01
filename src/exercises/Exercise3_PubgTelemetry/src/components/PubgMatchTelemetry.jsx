import { Fragment, memo, useEffect, useRef, useState } from 'react';
import { fetchKraftonPubgTelemetry } from '../api/krafton.js';
import { DEFAULT_SQUAD_ID } from '../config/telemetry.js';
import { PUBG_VN_SQUADS } from '../data/pubgSquads.js';
import styles from './PubgMatchTelemetry.module.css';

/**
 * @typedef {'IDLE'|'LOADING'|'SUCCESS'|'ERROR'} Status
 * @typedef {{ status: Status, data: import('../data/pubgSquads.js').Squad | null, error: string | null }} ViewState
 */

const IDLE_VIEW = Object.freeze({ status: 'IDLE', data: null, error: null });
const LOADING_VIEW = Object.freeze({ status: 'LOADING', data: null, error: null });

const STATUS_TEXT = Object.freeze({
  IDLE: 'Radar chờ kết nối',
  LOADING: 'Đang đồng bộ radar KRAFTON...',
  SUCCESS: 'Radar đã cập nhật',
  ERROR: 'Mất tín hiệu vệ tinh',
});

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
  // Kết quả thành công gần nhất theo squad: quay lại squad cũ không nháy skeleton.
  const cacheRef = useRef(new Map());

  useEffect(() => {
    const cached = cacheRef.current.get(squadId);
    if (cached) {
      setView({ status: 'SUCCESS', data: cached, error: null });
      return undefined;
    }

    const controller = new AbortController();
    setView(LOADING_VIEW);

    fetchKraftonPubgTelemetry(squadId, { signal: controller.signal })
      .then((squad) => {
        // Lớp bảo vệ thứ hai: kết quả muộn của request đã bị huỷ không được ghi đè.
        if (controller.signal.aborted) return;
        cacheRef.current.set(squadId, squad);
        setView({ status: 'SUCCESS', data: squad, error: null });
      })
      .catch((err) => {
        // Đổi squad nhanh sinh AbortError: là chủ đích, không phải lỗi mạng.
        if (err.name === 'AbortError' || controller.signal.aborted) return;
        setView({ status: 'ERROR', data: null, error: err.message });
      });

    return () => controller.abort();
  }, [squadId, retryTick]);

  return (
    <section className={styles.radar} aria-label="PUBG VN live radar">
      <SquadPicker squadId={squadId} onSelect={setSquadId} />
      <output className={styles.status} aria-live="polite">
        {STATUS_TEXT[view.status]}
      </output>
      {view.status === 'SUCCESS' && <TelemetryView squad={view.data} />}
      {view.status === 'ERROR' && (
        <TelemetryError message={view.error} onRetry={() => setRetryTick((tick) => tick + 1)} />
      )}
      {(view.status === 'IDLE' || view.status === 'LOADING') && <TelemetrySkeleton />}
    </section>
  );
}
