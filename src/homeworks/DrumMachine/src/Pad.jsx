import { keyLabel } from './drumPads.js';
import styles from './Pad.module.css';

/**
 * Một pad trống. aria-pressed theo isActive (sáng ngắn sau mỗi hit); không giữ state riêng.
 * Hình dạng và animation chọn bằng CSS qua data-sound.
 * Phần tử hình có key = hitId: mỗi hit mới React tạo phần tử mới, nên CSS animation chạy lại
 * từ đầu kể cả khi gõ liên tục (đổi class thôi thì animation đang chạy không khởi động lại).
 * @param {{
 *   pad: import('./drumPads.js').Pad,
 *   isActive: boolean,
 *   hitId?: number,
 *   onTrigger: (padId: string) => void,
 * }} props
 */
export function Pad({ pad, isActive, hitId, onTrigger }) {
  const key = keyLabel(pad);
  const shapeClass = hitId === undefined ? styles.shape : `${styles.shape} ${styles.hit}`;
  return (
    <button
      type="button"
      className={styles.pad}
      data-sound={pad.id}
      aria-pressed={isActive}
      aria-keyshortcuts={key}
      onClick={() => onTrigger(pad.id)}
    >
      <span key={hitId ?? 'idle'} className={shapeClass} aria-hidden="true" />
      <span className={styles.label}>{pad.label}</span>{' '}
      <kbd className={styles.key}>{key}</kbd>
    </button>
  );
}
