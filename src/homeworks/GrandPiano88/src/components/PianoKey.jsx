import { memo } from 'react';
import { spokenName } from '../music/notes.js';
import styles from './PianoKey.module.css';

const PRESS_CODES = new Set(['Space', 'Enter', 'NumpadEnter']);
const MOVE_CODES = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End']);

/**
 * Một phím đàn. Bọc bằng `memo` nên chỉ render lại khi một trong các prop dưới đây đổi.
 * Vì vậy mọi prop đều là giá trị nguyên thủy (số, chuỗi, boolean) hoặc hàm có tham chiếu ổn định;
 * `isPressed` là boolean riêng của phím này, không truyền cả Set các phím đang nhấn xuống.
 * Chuột/cảm ứng: nhấn khi pointerdown, nhả khi pointerup/leave/cancel (không có thì phím kẹt).
 * Bàn phím: Space/Enter nhấn giữ (e.code, bỏ e.repeat); mũi tên/Home/End đổi phím đang focus.
 * @param {{
 *   midi: number, noteName: string, isBlack: boolean, pitchClass: number,
 *   isPressed: boolean, tabbable: boolean,
 *   onNoteOn: (midi: number) => void, onNoteOff: (midi: number) => void,
 *   onMoveFocus: (midi: number, code: string) => void,
 * }} props
 */
export const PianoKey = memo(function PianoKey({
  midi,
  noteName,
  isBlack,
  pitchClass,
  isPressed,
  tabbable,
  onNoteOn,
  onNoteOff,
  onMoveFocus,
}) {
  const handleKeyDown = (e) => {
    if (PRESS_CODES.has(e.code)) {
      e.preventDefault(); // Space không cuộn trang; Enter không bắn click thừa
      if (!e.repeat) onNoteOn(midi);
    } else if (MOVE_CODES.has(e.code)) {
      e.preventDefault(); // mũi tên không cuộn vùng đàn
      onMoveFocus(midi, e.code);
    }
  };

  const handleKeyUp = (e) => {
    if (PRESS_CODES.has(e.code)) onNoteOff(midi);
  };

  return (
    <button
      type="button"
      className={isBlack ? `${styles.key} ${styles.black}` : `${styles.key} ${styles.white}`}
      data-midi={midi}
      data-pc={pitchClass}
      aria-label={spokenName(midi)}
      aria-pressed={isPressed}
      tabIndex={tabbable ? 0 : -1}
      onPointerDown={(e) => {
        if (e.button === 0) onNoteOn(midi);
      }}
      onPointerUp={() => onNoteOff(midi)}
      onPointerLeave={() => onNoteOff(midi)}
      onPointerCancel={() => onNoteOff(midi)}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={() => onNoteOff(midi)}
    >
      {/* Chỉ phím C ghi tên để người nhìn định vị quãng tám; trình đọc màn hình đọc aria-label. */}
      {!isBlack && pitchClass === 0 && <span className={styles.name}>{noteName}</span>}
    </button>
  );
});
