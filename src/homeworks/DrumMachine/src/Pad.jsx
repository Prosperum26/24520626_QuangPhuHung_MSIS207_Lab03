import styles from './Pad.module.css';

/**
 * Một pad trống. aria-pressed theo isActive (sáng ngắn sau mỗi hit); không giữ state riêng.
 * @param {{
 *   pad: import('./drumPads.js').Pad,
 *   isActive: boolean,
 *   onTrigger: (padId: string) => void,
 * }} props
 */
export function Pad({ pad, isActive, onTrigger }) {
  const key = pad.code.replace(/^Key/, '');
  return (
    <button
      type="button"
      className={styles.pad}
      aria-pressed={isActive}
      aria-keyshortcuts={key}
      onClick={() => onTrigger(pad.id)}
    >
      <span className={styles.label}>{pad.label}</span>{' '}
      <kbd className={styles.key}>{key}</kbd>
    </button>
  );
}
