import { ATTACK_S, MAX_VOICES, RELEASE_FLOOR, RELEASE_S, VOICE_GAIN } from '../pianoConfig.js';

const defaultCreateContext = () => (typeof AudioContext === 'undefined' ? null : new AudioContext());

/**
 * Đàn đa âm: mỗi nốt đang giữ là một voice (oscillator + gain). Không biết gì về React.
 * `voices` là Map midi -> { osc, gain }; Map giữ thứ tự chèn nên phần tử đầu là voice cũ nhất (FIFO).
 * Phụ thuộc truyền từ ngoài (createContext, onSteal) để test bằng đối tượng giả.
 */
export class PolyphonicSynth {
  #ctx = null;
  #voices = new Map();
  #disposed = false;
  #createContext;
  #onSteal;
  #maxVoices;

  /**
   * @param {number} maxVoices số nốt tối đa cùng lúc
   * @param {{ createContext?: () => AudioContext | null, onSteal?: (midi: number) => void }} options
   *   onSteal: gọi khi voice của một phím còn đang giữ bị cướp, để UI bỏ trạng thái nhấn của phím đó
   */
  constructor(maxVoices = MAX_VOICES, { createContext = defaultCreateContext, onSteal = () => {} } = {}) {
    this.#maxVoices = maxVoices;
    this.#createContext = createContext;
    this.#onSteal = onSteal;
  }

  /** Số voice đang giữ (không tính voice đang tắt dần 40 ms). */
  get voiceCount() {
    return this.#voices.size;
  }

  // Tạo context ở lần nhấn đầu: trình duyệt chặn âm thanh trước thao tác người dùng.
  #getContext() {
    if (this.#disposed) return null;
    if (!this.#ctx) this.#ctx = this.#createContext();
    if (this.#ctx?.state === 'suspended') this.#ctx.resume?.()?.catch?.(() => {});
    return this.#ctx;
  }

  noteOn(midi, freqHz) {
    if (this.#voices.has(midi)) return; // giữ phím thì không tạo voice thứ hai
    const ctx = this.#getContext();
    if (!ctx) return;

    if (this.#voices.size >= this.#maxVoices) {
      const oldestMidi = this.#voices.keys().next().value; // FIFO: voice chèn sớm nhất
      this.#release(this.#voices.get(oldestMidi));
      this.#voices.delete(oldestMidi);
      this.#onSteal(oldestMidi);
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(freqHz, now);
    // Attack: tăng gain từ 0 để lúc bắt đầu không có tiếng click.
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(VOICE_GAIN, now + ATTACK_S);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    this.#voices.set(midi, { osc, gain });
  }

  noteOff(midi) {
    const voice = this.#voices.get(midi);
    if (!voice) return;
    this.#voices.delete(midi);
    this.#release(voice);
  }

  stopAll() {
    for (const voice of this.#voices.values()) this.#release(voice);
    this.#voices.clear();
  }

  /** Dừng mọi nốt và đóng AudioContext (gọi khi unmount). Sau đó noteOn không còn tác dụng. */
  dispose() {
    this.stopAll();
    this.#disposed = true;
    this.#ctx?.close?.()?.catch?.(() => {});
    this.#ctx = null;
  }

  // Tắt dần rồi mới dừng oscillator (tránh tiếng pop), hết tiếng thì ngắt node để giải phóng bộ nhớ.
  #release({ osc, gain }) {
    const now = this.#ctx.currentTime;
    const param = gain.gain;
    param.cancelScheduledValues(now);
    // Bắt đầu ramp từ mức hiện tại; exponentialRamp không chạy được từ 0 nên chặn dưới bằng RELEASE_FLOOR.
    param.setValueAtTime(Math.max(param.value, RELEASE_FLOOR), now);
    param.exponentialRampToValueAtTime(RELEASE_FLOOR, now + RELEASE_S);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    osc.stop(now + RELEASE_S);
  }
}
