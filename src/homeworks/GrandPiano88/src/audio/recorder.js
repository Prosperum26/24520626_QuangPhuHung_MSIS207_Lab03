/** @typedef {{ midi:number, freqHz:number, durationMs:number, deltaMs:number }} NoteEvent */

const defaultNow = () => performance.now();

/**
 * Bộ ghi: hàng đợi FIFO các NoteEvent, không biết gì về React hay âm thanh.
 * - Sự kiện được tạo lúc nhấn (D5), nên thứ tự mảng = thứ tự bắt đầu nốt; hợp âm nhấn A rồi B nhả A rồi B
 *   vẫn ra A rồi B. `durationMs` điền lúc nhả.
 * - `deltaMs` = từ lúc bắt đầu nốt trước đến lúc bắt đầu nốt này; nốt đầu là 0 (D6), tức bỏ khoảng lặng đầu.
 * - Đồng hồ là performance.now() (đơn điệu, không bị đổi giờ hệ thống). Truyền `now` giả khi test.
 * @param {{ now?: () => number }} [options]
 */
export function createRecorder({ now = defaultNow } = {}) {
  let events = [];
  let recording = false;
  let lastStartMs = null;
  const open = new Map(); // midi -> { event, startMs }: nốt đã nhấn, chưa nhả

  function noteOff(midi) {
    const held = open.get(midi);
    if (!held) return;
    held.event.durationMs = now() - held.startMs;
    open.delete(midi);
  }

  return {
    /** Bắt đầu một bản ghi mới (xoá bản cũ). */
    start() {
      events = [];
      open.clear();
      lastStartMs = null;
      recording = true;
    },

    noteOn(midi, freqHz) {
      if (!recording || open.has(midi)) return;
      const startMs = now();
      const event = { midi, freqHz, durationMs: 0, deltaMs: lastStartMs === null ? 0 : startMs - lastStartMs };
      lastStartMs = startMs;
      events.push(event);
      open.set(midi, { event, startMs });
    },

    noteOff,

    /** Đóng mọi nốt còn đang giữ (cửa sổ mất focus). Vẫn tiếp tục ghi. */
    releaseAll() {
      for (const midi of [...open.keys()]) noteOff(midi);
    },

    /** Dừng ghi, đóng nốt còn mở với thời lượng tới lúc dừng, trả bản sao. */
    stop() {
      for (const midi of [...open.keys()]) noteOff(midi);
      recording = false;
      return events.map((event) => ({ ...event }));
    },

    /** Bản sao các sự kiện đã ghi (sửa bản sao không ảnh hưởng bộ ghi). */
    get events() {
      return events.map((event) => ({ ...event }));
    },

    get isRecording() {
      return recording;
    },
  };
}
