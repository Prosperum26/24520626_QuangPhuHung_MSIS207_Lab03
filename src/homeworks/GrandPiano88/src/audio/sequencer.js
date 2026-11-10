/** @typedef {import('./recorder.js').NoteEvent} NoteEvent */

const defaultNow = () => performance.now();

/**
 * Chờ `ms` mili giây; bị huỷ (signal abort) thì dọn timer và từ chối bằng signal.reason (AbortError).
 * Luôn có tối đa một timer đang chờ, và hết chờ thì gỡ listener: không để rò.
 */
export function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    if (ms <= 0) {
      resolve(); // đã tới hạn (hoặc quá hạn): không cần timer, các nốt trùng mốc (hợp âm) phát cùng lúc
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Mốc bắt đầu (ms từ đầu bản ghi) của từng nốt: cộng dồn deltaMs. Nơi duy nhất cộng dồn. */
export function startOffsets(events) {
  let total = 0;
  return events.map((event) => {
    total += event.deltaMs;
    return total;
  });
}

/**
 * Dòng thời gian gồm các bước nhấn/nhả theo mốc tương đối (đã chia cho tốc độ).
 * Cùng một mốc thì nhả đứng trước nhấn: nốt lặp lại cùng phím vẫn nhấn lại được.
 */
export function buildTimeline(events, speed) {
  const starts = startOffsets(events);
  const steps = events.flatMap((event, i) => [
    { at: starts[i] / speed, order: 1, type: 'on', midi: event.midi, freqHz: event.freqHz },
    { at: (starts[i] + event.durationMs) / speed, order: 0, type: 'off', midi: event.midi },
  ]);
  return steps.toSorted((a, b) => a.at - b.at || a.order - b.order);
}

/**
 * Phát lại bản ghi (D2): MỘT vòng async duyệt dòng thời gian, mỗi bước chờ tới mốc tuyệt đối
 * `bắt đầu + at`. Tính từ mốc tuyệt đối nên sai số không cộng dồn qua các nốt.
 * Huỷ bằng `signal`: nhả các nốt do chính lần phát này đang giữ rồi trả 'aborted'; không còn timer nào.
 * @param {NoteEvent[]} events
 * @param {{
 *   speed?: number, noteOn: (midi: number, freqHz: number) => void, noteOff: (midi: number) => void,
 *   signal: AbortSignal, now?: () => number, sleepFn?: typeof sleep,
 * }} options
 * @returns {Promise<'done' | 'aborted'>}
 */
export async function playSequence(events, { speed = 1, noteOn, noteOff, signal, now = defaultNow, sleepFn = sleep }) {
  if (!(speed > 0)) throw new RangeError('speed phải lớn hơn 0');
  const held = new Set(); // các nốt lần phát này đã nhấn mà chưa nhả
  const startedAt = now();
  try {
    for (const step of buildTimeline(events, speed)) {
      await sleepFn(startedAt + step.at - now(), signal);
      if (step.type === 'on') {
        held.add(step.midi);
        noteOn(step.midi, step.freqHz);
      } else {
        held.delete(step.midi);
        noteOff(step.midi);
      }
    }
    return 'done';
  } catch (error) {
    if (error?.name !== 'AbortError') throw error;
    for (const midi of held) noteOff(midi);
    return 'aborted';
  }
}
