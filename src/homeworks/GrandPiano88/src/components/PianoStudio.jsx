import { useCallback, useEffect, useState } from 'react';
import { createRecorder } from '../audio/recorder.js';
import { midiToFreq } from '../music/notes.js';
import { usePiano } from '../usePiano.js';
import { useSequencer } from '../useSequencer.js';
import { GrandPiano } from './GrandPiano.jsx';
import { Sequencer } from './Sequencer.jsx';
import styles from './PianoStudio.module.css';

/**
 * Nơi nối đàn, bộ ghi và phát lại (state được nâng lên đây để cả ba dùng chung một synth).
 * - Người chơi nhấn/nhả: đi qua `playerPress`/`playerRelease`, vừa phát vừa ghi (bộ ghi chỉ nhận khi đang ghi).
 * - Phát lại: gọi thẳng `press`/`release` của usePiano, nên không bị ghi lại.
 * - Người chơi được chơi chồng lên lúc phát lại: cùng một synth, tối đa 8 voice, steal FIFO như thường.
 */
export function PianoStudio() {
  const [recorder] = useState(() => createRecorder());
  // Voice bị cướp: phím hết sáng (trong usePiano) và nốt đang ghi cũng phải đóng lại.
  const { pressed, press, release } = usePiano({ onSteal: recorder.noteOff });
  const sequencer = useSequencer({ recorder, press, release });

  const playerPress = useCallback(
    (midi) => {
      press(midi);
      recorder.noteOn(midi, midiToFreq(midi));
    },
    [press, recorder],
  );

  const playerRelease = useCallback(
    (midi) => {
      release(midi);
      recorder.noteOff(midi);
    },
    [release, recorder],
  );

  // Cửa sổ mất focus: usePiano đã nhả hết phím; bộ ghi cũng phải đóng các nốt đang mở.
  useEffect(() => {
    window.addEventListener('blur', recorder.releaseAll);
    return () => window.removeEventListener('blur', recorder.releaseAll);
  }, [recorder]);

  return (
    <div className={styles.studio}>
      <Sequencer
        status={sequencer.status}
        count={sequencer.count}
        speed={sequencer.speed}
        message={sequencer.message}
        onRecord={sequencer.startRecording}
        onStopRecord={sequencer.stopRecording}
        onPlay={sequencer.play}
        onStop={sequencer.stop}
        onSpeedChange={sequencer.setSpeed}
      />
      <GrandPiano pressed={pressed} onNoteOn={playerPress} onNoteOff={playerRelease} />
    </div>
  );
}
