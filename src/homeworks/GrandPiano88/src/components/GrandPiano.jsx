import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { buildKeys, groupByOctave, octaveLayout } from '../music/notes.js';
import { DEFAULT_FOCUS_MIDI, MIDI_MAX, MIDI_MIN } from '../pianoConfig.js';
import { PianoKey } from './PianoKey.jsx';
import styles from './GrandPiano.module.css';

// Tính một lần ở module-level: 88 phím không đổi, không cần tính lại mỗi lần render.
const OCTAVES = groupByOctave(buildKeys()).map((group) => ({ ...group, ...octaveLayout(group) }));

const clampMidi = (midi) => Math.min(MIDI_MAX, Math.max(MIDI_MIN, midi));

/** Phím đích khi bấm mũi tên/Home/End từ phím `midi`. */
function moveTarget(midi, code) {
  if (code === 'Home') return MIDI_MIN;
  if (code === 'End') return MIDI_MAX;
  return clampMidi(midi + (code === 'ArrowLeft' ? -1 : 1));
}

/**
 * Đàn 88 phím, thuần hiển thị: `pressed` (Set các phím đang nhấn) và hai hàm nhấn/nhả do cha truyền vào
 * (cha nối chúng với synth và bộ ghi, xem PianoStudio). Mỗi phím nhận boolean `pressed.has(midi)` riêng. Nhấn một phím: GrandPiano render lại một lần, nhưng 87 PianoKey
 * còn lại bị `memo` bỏ qua vì mọi prop của chúng không đổi.
 * Roving tabindex: chỉ một phím (`focusMidi`) nằm trong thứ tự Tab; mũi tên di chuyển giữa các phím.
 * @param {{ pressed: Set<number>, onNoteOn: (midi: number) => void, onNoteOff: (midi: number) => void }} props
 */
export function GrandPiano({ pressed, onNoteOn, onNoteOff }) {
  const headingId = useId();
  const [focusMidi, setFocusMidi] = useState(DEFAULT_FOCUS_MIDI);
  const scrollerRef = useRef(null);

  const moveFocus = useCallback((midi, code) => {
    const target = moveTarget(midi, code);
    setFocusMidi(target);
    scrollerRef.current?.querySelector(`[data-midi="${target}"]`)?.focus();
  }, []);

  // Mở trang ở giữa đàn (quanh C4) thay vì ở tận A0, nơi gần như không nghe thấy gì.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const middleC = scroller?.querySelector(`[data-midi="${DEFAULT_FOCUS_MIDI}"]`);
    if (!scroller || !middleC) return;
    scroller.scrollLeft = middleC.offsetLeft - (scroller.clientWidth - middleC.offsetWidth) / 2;
  }, []);

  return (
    <section className={styles.piano} aria-labelledby={headingId}>
      <h2 id={headingId}>Bàn phím 88 phím</h2>
      <p className={styles.hint}>
        Chạm hoặc bấm chuột vào phím. Bằng bàn phím: Tab vào đàn, mũi tên để đổi phím, giữ Space hoặc Enter để chơi.
      </p>
      <div ref={scrollerRef} className={styles.scroller}>
        {OCTAVES.map((group) => (
          <div
            key={group.octave}
            className={styles.octave}
            role="group"
            aria-label={`Quãng tám ${group.octave}`}
            data-lead={group.lead}
            data-trail={group.trail}
          >
            {group.keys.map((key) => (
              <PianoKey
                key={key.midi}
                midi={key.midi}
                noteName={key.noteName}
                isBlack={key.isBlack}
                pitchClass={key.pitchClass}
                isPressed={pressed.has(key.midi)}
                tabbable={key.midi === focusMidi}
                onNoteOn={onNoteOn}
                onNoteOff={onNoteOff}
                onMoveFocus={moveFocus}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
