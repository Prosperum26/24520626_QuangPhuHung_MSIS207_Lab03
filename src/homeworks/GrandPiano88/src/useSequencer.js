import { useCallback, useEffect, useRef, useState } from 'react';
import { playSequence } from './audio/sequencer.js';

/** 0.5 -> "0,5x", 1 -> "1x": dùng cho nhãn tốc độ và thông báo. */
export const formatSpeed = (speed) => `${String(speed).replace('.', ',')}x`;

/**
 * Trạng thái của bộ ghi và phát lại. Bản ghi nằm trong `recorder` (đối tượng ổn định, không phải state);
 * state chỉ có những thứ giao diện cần vẽ: status, số nốt đã ghi, tốc độ, thông báo.
 * Phát lại gọi `press`/`release` thô (không qua bộ ghi) nên không tự ghi lại chính nó.
 * @param {{
 *   recorder: ReturnType<typeof import('./audio/recorder.js').createRecorder>,
 *   press: (midi: number) => void,
 *   release: (midi: number) => void,
 * }} deps
 */
export function useSequencer({ recorder, press, release }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'recording' | 'playing'
  const [count, setCount] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [message, setMessage] = useState('Bấm Ghi, chơi vài nốt rồi bấm Dừng ghi.');
  const controllerRef = useRef(null);

  const startRecording = useCallback(() => {
    recorder.start();
    setCount(0);
    setStatus('recording');
    setMessage('Đang ghi. Chơi vài nốt rồi bấm Dừng ghi.');
  }, [recorder]);

  const stopRecording = useCallback(() => {
    const events = recorder.stop();
    setCount(events.length);
    setStatus('idle');
    setMessage(events.length > 0 ? `Đã ghi ${events.length} nốt. Bấm Phát để nghe lại.` : 'Chưa ghi nốt nào.');
  }, [recorder]);

  const play = useCallback(() => {
    const events = recorder.events;
    if (events.length === 0) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('playing');
    setMessage(`Đang phát ${events.length} nốt ở tốc độ ${formatSpeed(speed)}.`);
    playSequence(events, { speed, noteOn: press, noteOff: release, signal: controller.signal }).then((result) => {
      if (controllerRef.current !== controller) return; // đã unmount hoặc đã có lần phát mới
      controllerRef.current = null;
      setStatus('idle');
      setMessage(result === 'done' ? 'Phát xong.' : 'Đã dừng.');
    });
  }, [recorder, speed, press, release]);

  const stop = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  // Unmount: huỷ lần phát đang chạy (nhả nốt, gỡ timer) và không cập nhật state nữa.
  useEffect(
    () => () => {
      const controller = controllerRef.current;
      controllerRef.current = null;
      controller?.abort();
    },
    [],
  );

  return { status, count, speed, setSpeed, message, startRecording, stopRecording, play, stop };
}
