import { useId } from 'react';
import { DROP_WINDOW_MS, getDropPhase } from '../domain/dropPhase.js';
import { formatCountdown } from '../domain/formatCountdown.js';
import { formatVnd } from '../domain/formatVnd.js';
import { useCrateClaim } from '../hooks/useCrateClaim.js';
import { usePubgAirdropTimer } from '../hooks/usePubgAirdropTimer.js';
import styles from './CrateCard.module.css';

const PHASE_LABEL = {
  WARMUP: 'Sắp mở',
  AIRDROP_LIVE: 'Đang mở',
  LOOTED_OUT: 'Hết hàng',
  EXPIRED: 'Đã đóng',
};

const PHASE_REASON = {
  WARMUP: 'Chưa tới giờ drop.',
  LOOTED_OUT: 'Crate đã hết hàng.',
  EXPIRED: 'Đã quá thời hạn mở airdrop.',
};

/**
 * @param {object} props
 * @param {import('../domain/contract.js').PubgCrateDrop} props.crate
 * @param {(crateId: string, options: { signal: AbortSignal }) => Promise<import('../api/arena.js').ReserveResult>} props.reserveCrate
 * @param {number} [props.serverOffsetMs]
 */
export function CrateCard({ crate, reserveCrate, serverOffsetMs = 0 }) {
  const headingId = useId();
  const reasonId = useId();

  const { remainingMs } = usePubgAirdropTimer(crate.dropEpochMs, serverOffsetMs);
  // Hạn đóng là một mốc đếm ngược nữa: dùng lại đúng hook của slide thay vì gọi Date.now() trong render.
  const { isLive: isExpired } = usePubgAirdropTimer(crate.dropEpochMs + DROP_WINDOW_MS, serverOffsetMs);
  const { stock, status, error, claim } = useCrateClaim({
    crateId: crate.id,
    initialStock: crate.remainingStock,
    reserveCrate,
  });

  const phase = getDropPhase({ remainingMs, remainingStock: stock, isExpired });
  const isPending = status === 'pending';
  const canClaim = phase === 'AIRDROP_LIVE' && !isPending;
  const reason = isPending ? 'Đang giữ chỗ...' : PHASE_REASON[phase];

  return (
    <article className={styles.card} aria-labelledby={headingId} data-phase={phase}>
      <header className={styles.header}>
        <h3 id={headingId} className={styles.title}>{crate.title}</h3>
        <p className={styles.phase}>{PHASE_LABEL[phase]}</p>
      </header>

      <dl className={styles.facts}>
        <dt>Giá</dt>
        <dd>{formatVnd(crate.priceVnd)}</dd>
        <dt>Còn lại</dt>
        <dd>{stock}</dd>
        <dt>{phase === 'WARMUP' ? 'Mở sau' : 'Giờ drop'}</dt>
        <dd>
          <output className={styles.countdown} aria-live="off">{formatCountdown(remainingMs)}</output>
        </dd>
      </dl>

      <button
        type="button"
        className={styles.claim}
        disabled={!canClaim}
        aria-describedby={canClaim ? undefined : reasonId}
        onClick={claim}
      >
        Claim
      </button>
      {!canClaim && <p id={reasonId} className={styles.reason}>{reason}</p>}

      <p role="status" className={styles.status}>
        {status === 'claimed' ? 'Đã giữ chỗ thành công.' : ''}
      </p>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </article>
  );
}
