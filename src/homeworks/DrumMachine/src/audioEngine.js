import { PADS } from './drumPads.js';
import { DEFAULT_KIT_ID, KITS, kitUrl } from './kits.js';

/** Lệch tốc độ phát mỗi hit (±3%): hết cảm giác "máy bắn" mà không đổi nốt rõ rệt. */
export const RATE_JITTER = 0.03;
/** Lệch âm lượng mỗi hit (±10%). */
export const GAIN_JITTER = 0.1;
/** Mức dB thấp nhất báo ra; im lặng và tiếng quá nhỏ đều về đây. */
export const SILENCE_DB = -60;
export const DEFAULT_VOLUME = 0.8;

const CHOKE_FADE_S = 0.01; // hằng số thời gian tắt dần khi bị cắt tiếng
const CHOKE_STOP_S = 0.06; // dừng hẳn sau khi đã tắt dần, tránh tiếng "pop"
const ANALYSER_SIZE = 1024;

const PAD_BY_ID = new Map(PADS.map((pad) => [pad.id, pad]));

const defaultCreateContext = () => (typeof AudioContext === 'undefined' ? null : new AudioContext());
const defaultFetch = (url) => fetch(url);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/**
 * Engine âm thanh, không biết gì về React. Chuỗi âm:
 * source -> gain của voice -> masterGain -> analyser -> destination.
 * Mỗi hit tạo một AudioBufferSourceNode mới nên phát chồng được; hết tiếng thì disconnect.
 * Phụ thuộc truyền từ ngoài (createContext, fetchFn, random) để test bằng đối tượng giả.
 */
export function createAudioEngine({
  createContext = defaultCreateContext,
  fetchFn = defaultFetch,
  random = Math.random,
  baseUrl = import.meta.env.BASE_URL,
  onError = () => {},
} = {}) {
  let ctx = null;
  let master = null;
  let analyser = null;
  let disposed = false;
  let kitId = DEFAULT_KIT_ID;
  let volume = DEFAULT_VOLUME;
  let muted = false;
  const levelBuffer = new Float32Array(ANALYSER_SIZE);

  const rawByKit = new Map(); // kitId -> Promise<Map<padId, ArrayBuffer>>
  const decodeByKit = new Map(); // kitId -> Promise<void>
  const buffersByKit = new Map(); // kitId -> Map<padId, AudioBuffer> (đọc đồng bộ khi phát)
  const voicesByGroup = new Map(); // chokeGroup -> Set<{ source, gain }>

  function applyMaster() {
    if (master) master.gain.value = muted ? 0 : volume;
  }

  // Tạo context ở lần nhấn đầu: trình duyệt chặn âm thanh trước thao tác người dùng.
  function getContext() {
    if (disposed) return null;
    if (!ctx) {
      ctx = createContext();
      if (!ctx) return null;
      master = ctx.createGain();
      analyser = ctx.createAnalyser();
      analyser.fftSize = ANALYSER_SIZE;
      master.connect(analyser);
      analyser.connect(ctx.destination);
      applyMaster();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  /** Tải byte thô của kit; không cần AudioContext nên làm được trước thao tác đầu tiên. */
  function prefetch(id) {
    if (!rawByKit.has(id)) {
      const promise = Promise.all(
        PADS.map(async (pad) => {
          const response = await fetchFn(`${baseUrl}${kitUrl(id, pad.id)}`);
          if (!response.ok) throw new Error(`Không tải được ${pad.id}.wav của kit ${id} (HTTP ${response.status})`);
          return [pad.id, await response.arrayBuffer()];
        }),
      ).then((entries) => new Map(entries));
      rawByKit.set(id, promise);
      promise.catch(() => rawByKit.delete(id)); // cho phép thử lại lần sau
    }
    return rawByKit.get(id);
  }

  /** Giải mã kit (cần AudioContext). Gọi nhiều lần vẫn chỉ giải mã một lần. */
  function loadKit(id) {
    if (buffersByKit.has(id)) return Promise.resolve();
    const c = getContext();
    if (!c) return Promise.resolve();
    if (!decodeByKit.has(id)) {
      const promise = prefetch(id)
        .then((raw) => Promise.all([...raw].map(async ([padId, bytes]) => [padId, await c.decodeAudioData(bytes)])))
        .then((entries) => {
          buffersByKit.set(id, new Map(entries));
        })
        .catch((error) => {
          decodeByKit.delete(id);
          onError(error);
          throw error;
        });
      decodeByKit.set(id, promise);
    }
    return decodeByKit.get(id);
  }

  function chokeGroup(c, group) {
    const voices = voicesByGroup.get(group);
    if (!voices) return;
    for (const voice of voices) {
      voice.gain.gain.cancelScheduledValues(c.currentTime);
      voice.gain.gain.setTargetAtTime(0, c.currentTime, CHOKE_FADE_S);
      voice.source.stop(c.currentTime + CHOKE_STOP_S);
    }
    voices.clear();
  }

  function startVoice(c, pad, buffer, when) {
    if (!buffer) return;
    if (pad.chokeGroup) chokeGroup(c, pad.chokeGroup);

    const source = c.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1 + (random() * 2 - 1) * RATE_JITTER;
    const gain = c.createGain();
    gain.gain.value = 1 + (random() * 2 - 1) * GAIN_JITTER;
    source.connect(gain);
    gain.connect(master);

    const voice = { source, gain };
    if (pad.chokeGroup) {
      if (!voicesByGroup.has(pad.chokeGroup)) voicesByGroup.set(pad.chokeGroup, new Set());
      voicesByGroup.get(pad.chokeGroup).add(voice);
    }
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      voicesByGroup.get(pad.chokeGroup)?.delete(voice);
    };
    source.start(when ?? 0);
  }

  /**
   * @param {string} padId
   * @param {{ when?: number }} [options] when: giờ AudioContext (giây); bỏ trống là phát ngay.
   */
  function play(padId, { when } = {}) {
    const pad = PAD_BY_ID.get(padId);
    const c = pad ? getContext() : null;
    if (!pad || !c) return;

    const ready = buffersByKit.get(kitId);
    if (ready) {
      startVoice(c, pad, ready.get(pad.id), when);
      return;
    }
    // Hit đầu tiên: giải mã xong mới phát. Lỗi đã báo qua onError.
    const wantedKit = kitId;
    loadKit(wantedKit)
      .then(() => {
        if (!disposed) startVoice(c, pad, buffersByKit.get(wantedKit)?.get(pad.id), when);
      })
      .catch(() => {});
  }

  function setKit(id) {
    if (!KITS.some((kit) => kit.id === id)) throw new Error(`Kit không tồn tại: ${id}`);
    kitId = id;
  }

  function setVolume(value) {
    volume = clamp01(value);
    applyMaster();
  }

  function setMuted(value) {
    muted = value;
    applyMaster();
  }

  /** Mức RMS hiện tại tính bằng dB, kẹp dưới ở SILENCE_DB. */
  function getLevelDb() {
    if (!analyser) return SILENCE_DB;
    analyser.getFloatTimeDomainData(levelBuffer);
    let sum = 0;
    for (const sample of levelBuffer) sum += sample * sample;
    const rms = Math.sqrt(sum / levelBuffer.length);
    return rms > 0 ? Math.max(SILENCE_DB, 20 * Math.log10(rms)) : SILENCE_DB;
  }

  const now = () => (ctx ? ctx.currentTime : 0);

  function dispose() {
    disposed = true;
    voicesByGroup.clear();
    if (ctx) ctx.close().catch(() => {});
    ctx = null;
    master = null;
    analyser = null;
  }

  return { prefetch, loadKit, play, setKit, setVolume, setMuted, getLevelDb, now, dispose };
}
