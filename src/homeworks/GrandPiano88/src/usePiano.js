import { useCallback, useEffect, useRef, useState } from 'react';
import { PolyphonicSynth } from './audio/PolyphonicSynth.js';
import { midiToFreq } from './music/notes.js';
import { MAX_VOICES } from './pianoConfig.js';

const EMPTY = new Set();

/**
 * Nối PolyphonicSynth với React.
 * - Synth nằm trong ref (không phải state): đổi nó không gây render. Tạo lười ở lần nhấn đầu, nên
 *   StrictMode (cleanup rồi mount lại) tự tạo synth mới nếu cái cũ đã dispose.
 * - State duy nhất là `pressed`: Set các midi đang nhấn, luôn tạo Set mới (bất biến).
 * - `press`/`release` có tham chiếu ổn định (không phụ thuộc state) để PianoKey bọc memo không render lại.
 * @param {{ maxVoices?: number, createContext?: () => AudioContext | null }} [options] chỉ đọc lúc tạo synth
 */
export function usePiano(options = {}) {
  const [pressed, setPressed] = useState(EMPTY);
  const synthRef = useRef(null);
  const optionsRef = useRef(options);

  const removePressed = useCallback((midi) => {
    // Trả lại đúng Set cũ nếu không đổi gì: React bỏ qua render.
    setPressed((prev) => {
      if (!prev.has(midi)) return prev;
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
  }, []);

  const getSynth = useCallback(() => {
    if (!synthRef.current) {
      const { maxVoices = MAX_VOICES, createContext } = optionsRef.current;
      // Voice bị cướp lúc phím còn đang giữ thì phím đó phải hết sáng.
      synthRef.current = new PolyphonicSynth(maxVoices, { createContext, onSteal: removePressed });
    }
    return synthRef.current;
  }, [removePressed]);

  const press = useCallback(
    (midi) => {
      getSynth().noteOn(midi, midiToFreq(midi));
      setPressed((prev) => {
        if (prev.has(midi)) return prev;
        return new Set(prev).add(midi);
      });
    },
    [getSynth],
  );

  const release = useCallback(
    (midi) => {
      synthRef.current?.noteOff(midi);
      removePressed(midi);
    },
    [removePressed],
  );

  const releaseAll = useCallback(() => {
    synthRef.current?.stopAll();
    setPressed((prev) => (prev.size === 0 ? prev : EMPTY));
  }, []);

  // Cửa sổ mất focus thì không nhận được keyup/pointerup nữa: nhả hết để không kẹt phím.
  // Unmount: đóng AudioContext.
  useEffect(() => {
    window.addEventListener('blur', releaseAll);
    return () => {
      window.removeEventListener('blur', releaseAll);
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, [releaseAll]);

  return { pressed, press, release, releaseAll };
}
