import { useCallback, useEffect, useRef, useState } from 'react';
import { eventsInWindow, positionAt, reanchor, toAudioTime } from './loopScheduler.js';
import { DEFAULT_LOOP_MODE, LOOKAHEAD_MS, MIN_LOOP_MS, SPEED_DEFAULT, TICK_MS } from './looperConfig.js';

/**
 * Looper kiểu loop pedal: Record -> Stop thì độ dài vòng = thời gian đã ghi, rồi tự phát.
 *
 * Trạng thái: empty -> recording -> playing <-> overdubbing; playing/overdubbing -> ready (Stop,
 * hoặc hết vòng ở chế độ "Một lần"); ready -> playing (Play); Clear về empty.
 *
 * Chỉ những gì giao diện cần vẽ (mode, loopMode, speed, progress) là state. Bản ghi, độ dài vòng,
 * anchor đồng hồ nằm trong ref vì không gây vẽ lại, và để tick đọc luôn giá trị mới nhất.
 *
 * Phát lại dùng bộ lập lịch look-ahead: mỗi TICK_MS nhìn trước LOOKAHEAD_MS trên đồng hồ audio
 * và đặt `when` cho từng hit. Tiếng không phụ thuộc độ chính xác của setInterval nên không trôi nhịp.
 * Giới hạn đã biết: tab nền bị trình duyệt giãn interval (~1 giây) thì hit overdub gõ lúc đó có thể
 * phát đúp một lần; cửa sổ look-ahead không kịp tiến trước vị trí hiện tại.
 *
 * @param {{
 *   trigger: (padId: string, options?: { when?: number }) => void,
 *   now: () => number,   // giờ audio (giây)
 * }} deps
 */
export function useLooper({ trigger, now }) {
  const [mode, setMode] = useState('empty');
  const [loopMode, setLoopMode] = useState(DEFAULT_LOOP_MODE);
  const [speed, setSpeed] = useState(SPEED_DEFAULT);
  const [progress, setProgress] = useState(0); // 0..100, làm tròn để chỉ vẽ lại tối đa 100 lần mỗi vòng

  const modeRef = useRef('empty'); // bản sao của mode để capture() ổn định đọc được
  const eventsRef = useRef([]); // LoopEvent[], bất biến: luôn thay bằng mảng mới
  const loopLenRef = useRef(0); // giây
  const recordStartRef = useRef(0); // giờ audio lúc bắt đầu ghi
  const anchorRef = useRef({ audioTime: 0, loopT: 0, speed: SPEED_DEFAULT });
  const lastToRef = useRef(0); // thời gian vòng đã lên lịch tới đâu

  const changeMode = useCallback((next) => {
    modeRef.current = next;
    setMode(next);
  }, []);

  const isRunning = mode === 'playing' || mode === 'overdubbing';

  // Tick lập lịch: chỉ tồn tại khi đang phát; cleanup xoá interval.
  useEffect(() => {
    if (!isRunning) return undefined;
    const repeat = loopMode === 'loop';

    const id = setInterval(() => {
      const anchor = anchorRef.current;
      const loopLen = loopLenRef.current;
      const current = now();
      const position = positionAt(anchor, current);
      const lookaheadEnd = positionAt(anchor, current + LOOKAHEAD_MS / 1000);
      const to = repeat ? lookaheadEnd : Math.min(lookaheadEnd, loopLen);

      for (const hit of eventsInWindow(eventsRef.current, loopLen, lastToRef.current, to, repeat)) {
        trigger(hit.padId, { when: toAudioTime(anchor, hit.t) });
      }
      lastToRef.current = Math.max(lastToRef.current, to);

      if (!repeat && position >= loopLen) {
        setProgress(0);
        changeMode('ready');
      } else {
        setProgress(Math.round(((position % loopLen) / loopLen) * 100));
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [isRunning, loopMode, trigger, now, changeMode]);

  function startPlayback() {
    anchorRef.current = { audioTime: now(), loopT: 0, speed };
    lastToRef.current = 0;
    setProgress(0);
    changeMode('playing');
  }

  function clear() {
    eventsRef.current = [];
    loopLenRef.current = 0;
    setProgress(0);
    changeMode('empty');
  }

  /** Nút Record: bắt đầu ghi, hoặc dừng ghi và chuyển sang phát. */
  function record() {
    if (modeRef.current === 'empty') {
      eventsRef.current = [];
      recordStartRef.current = now();
      changeMode('recording');
    } else if (modeRef.current === 'recording') {
      const loopLen = now() - recordStartRef.current;
      if (eventsRef.current.length === 0 || loopLen * 1000 < MIN_LOOP_MS) {
        clear();
        return;
      }
      loopLenRef.current = loopLen;
      startPlayback();
    }
  }

  /** Nút Play/Stop. */
  function togglePlay() {
    if (modeRef.current === 'ready') {
      startPlayback();
    } else if (modeRef.current === 'playing' || modeRef.current === 'overdubbing') {
      setProgress(0);
      changeMode('ready');
    }
  }

  /** Nút Overdub: chồng thêm lớp lên vòng đang phát. */
  function toggleOverdub() {
    if (modeRef.current === 'playing') changeMode('overdubbing');
    else if (modeRef.current === 'overdubbing') changeMode('playing');
  }

  /** Đổi tốc độ. Đang chạy thì đặt lại anchor để vị trí không nhảy. */
  function changeSpeed(next) {
    if (modeRef.current === 'playing' || modeRef.current === 'overdubbing') {
      anchorRef.current = reanchor(anchorRef.current, now(), next);
    }
    setSpeed(next);
  }

  /** DrumMachine gọi mỗi hit trực tiếp của người chơi (không gọi cho hit phát lại). */
  const capture = useCallback(
    (padId) => {
      if (modeRef.current === 'recording') {
        eventsRef.current = [...eventsRef.current, { t: now() - recordStartRef.current, padId }];
      } else if (modeRef.current === 'overdubbing') {
        const t = positionAt(anchorRef.current, now()) % loopLenRef.current;
        eventsRef.current = [...eventsRef.current, { t, padId }];
      }
    },
    [now],
  );

  return {
    mode,
    loopMode,
    setLoopMode,
    speed,
    setSpeed: changeSpeed,
    progress,
    record,
    togglePlay,
    toggleOverdub,
    clear,
    capture,
  };
}
