import { describe, it, expect, vi } from 'vitest';
import { createAudioEngine, RATE_JITTER, GAIN_JITTER, SILENCE_DB } from './audioEngine.js';

function makeNode(extra = {}) {
  return { connect: vi.fn(), disconnect: vi.fn(), ...extra };
}

function createFakeContext() {
  const ctx = {
    currentTime: 0,
    state: 'suspended',
    destination: makeNode(),
    sources: [],
    gains: [],
    analyser: null,
    resume: vi.fn(() => {
      ctx.state = 'running';
      return Promise.resolve();
    }),
    close: vi.fn(() => Promise.resolve()),
    createGain() {
      const gain = makeNode({
        gain: { value: 1, setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
      });
      ctx.gains.push(gain);
      return gain;
    },
    createAnalyser() {
      ctx.analyser = makeNode({ fftSize: 0, getFloatTimeDomainData: vi.fn() });
      return ctx.analyser;
    },
    createBufferSource() {
      const source = makeNode({
        buffer: null,
        playbackRate: { value: 1 },
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
      });
      ctx.sources.push(source);
      return source;
    },
    decodeAudioData: vi.fn(async (bytes) => ({ decodedFrom: bytes.byteLength })),
  };
  return ctx;
}

function okFetch(fetched) {
  return vi.fn(async (url) => {
    fetched.push(url);
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
  });
}

function setup(options = {}) {
  const ctx = createFakeContext();
  const fetched = [];
  const engine = createAudioEngine({
    createContext: () => ctx,
    fetchFn: okFetch(fetched),
    random: () => 0.5,
    baseUrl: '/',
    ...options,
  });
  return { ctx, engine, fetched };
}

const master = (ctx) => ctx.gains[0];

describe('audioEngine', () => {
  it('không có AudioContext thì play không ném lỗi và mức là sàn', () => {
    const engine = createAudioEngine({ createContext: () => null, fetchFn: vi.fn(), random: () => 0.5 });
    expect(() => engine.play('kick')).not.toThrow();
    expect(engine.getLevelDb()).toBe(SILENCE_DB);
    expect(engine.now()).toBe(0);
  });

  it('prefetch tải đủ 7 file của kit mà chưa tạo AudioContext', async () => {
    const fetched = [];
    const createContext = vi.fn();
    const engine = createAudioEngine({ createContext, fetchFn: okFetch(fetched), random: () => 0.5, baseUrl: '/' });
    await engine.prefetch('acoustic');
    expect(createContext).not.toHaveBeenCalled();
    expect(fetched).toHaveLength(7);
    expect(fetched).toContain('/kits/acoustic/kick.wav');
  });

  it('play lần đầu giải mã kit rồi phát đúng một source; tạo context và resume', async () => {
    const { ctx, engine } = setup();
    engine.play('kick');
    await engine.loadKit('acoustic');
    await Promise.resolve();
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(7);
    expect(ctx.resume).toHaveBeenCalled();
    expect(ctx.sources).toHaveLength(1);
    expect(ctx.sources[0].start).toHaveBeenCalledTimes(1);
  });

  it('nhấn nhanh N lần tạo N source (phát chồng)', async () => {
    const { ctx, engine } = setup();
    await engine.loadKit('acoustic');
    for (let i = 0; i < 10; i++) engine.play('snare');
    expect(ctx.sources).toHaveLength(10);
    ctx.sources.forEach((s) => expect(s.start).toHaveBeenCalledTimes(1));
  });

  it('hết tiếng thì disconnect source và gain (không rò)', async () => {
    const { ctx, engine } = setup();
    await engine.loadKit('acoustic');
    engine.play('kick');
    const source = ctx.sources[0];
    source.onended();
    expect(source.disconnect).toHaveBeenCalled();
    expect(ctx.gains[1].disconnect).toHaveBeenCalled();
  });

  it('humanize: lệch rate và gain trong khoảng cho phép', async () => {
    const hi = setup({ random: () => 1 });
    await hi.engine.loadKit('acoustic');
    hi.engine.play('kick');
    expect(hi.ctx.sources[0].playbackRate.value).toBeCloseTo(1 + RATE_JITTER);
    expect(hi.ctx.gains[1].gain.value).toBeCloseTo(1 + GAIN_JITTER);

    const lo = setup({ random: () => 0 });
    await lo.engine.loadKit('acoustic');
    lo.engine.play('kick');
    expect(lo.ctx.sources[0].playbackRate.value).toBeCloseTo(1 - RATE_JITTER);

    const mid = setup({ random: () => 0.5 });
    await mid.engine.loadKit('acoustic');
    mid.engine.play('kick');
    expect(mid.ctx.sources[0].playbackRate.value).toBe(1);
  });

  it('choke: hi-hat đóng cắt hi-hat mở, nhưng kick thì không bị cắt', async () => {
    const { ctx, engine } = setup();
    await engine.loadKit('acoustic');
    engine.play('openhat');
    engine.play('kick');
    engine.play('hihat');
    const [open, kick, closed] = ctx.sources;
    expect(open.stop).toHaveBeenCalledTimes(1);
    expect(kick.stop).not.toHaveBeenCalled();
    expect(closed.stop).not.toHaveBeenCalled();
  });

  it('choke không đụng voice đã ended', async () => {
    const { ctx, engine } = setup();
    await engine.loadKit('acoustic');
    engine.play('openhat');
    ctx.sources[0].onended();
    engine.play('hihat');
    expect(ctx.sources[0].stop).not.toHaveBeenCalled();
  });

  it('volume đổi gain master; mute về 0; bỏ mute khôi phục; kẹp 0..1', async () => {
    const { ctx, engine } = setup();
    await engine.loadKit('acoustic');
    engine.setVolume(0.4);
    expect(master(ctx).gain.value).toBeCloseTo(0.4);
    engine.setMuted(true);
    expect(master(ctx).gain.value).toBe(0);
    engine.setMuted(false);
    expect(master(ctx).gain.value).toBeCloseTo(0.4);
    engine.setVolume(5);
    expect(master(ctx).gain.value).toBe(1);
    engine.setVolume(-1);
    expect(master(ctx).gain.value).toBe(0);
  });

  it('volume và mute đặt trước khi có context vẫn được áp khi context tạo ra', async () => {
    const { ctx, engine } = setup();
    engine.setVolume(0.3);
    engine.setMuted(true);
    await engine.loadKit('acoustic');
    expect(master(ctx).gain.value).toBe(0);
    engine.setMuted(false);
    expect(master(ctx).gain.value).toBeCloseTo(0.3);
  });

  it('getLevelDb: RMS 0.1 ra -20 dB; im lặng và quá nhỏ ra sàn', async () => {
    const { ctx, engine } = setup();
    await engine.loadKit('acoustic');
    ctx.analyser.getFloatTimeDomainData.mockImplementation((arr) => arr.fill(0.1));
    expect(engine.getLevelDb()).toBeCloseTo(-20, 1);
    ctx.analyser.getFloatTimeDomainData.mockImplementation((arr) => arr.fill(0));
    expect(engine.getLevelDb()).toBe(SILENCE_DB);
    ctx.analyser.getFloatTimeDomainData.mockImplementation((arr) => arr.fill(0.0001));
    expect(engine.getLevelDb()).toBe(SILENCE_DB);
  });

  it('when được truyền vào start()', async () => {
    const { ctx, engine } = setup();
    await engine.loadKit('acoustic');
    engine.play('kick', { when: 1.5 });
    expect(ctx.sources[0].start).toHaveBeenCalledWith(1.5);
  });

  it('padId lạ thì bỏ qua', async () => {
    const { ctx, engine } = setup();
    await engine.loadKit('acoustic');
    engine.play('nope');
    expect(ctx.sources).toHaveLength(0);
  });

  it('setKit: hit sau đó dùng buffer của kit mới', async () => {
    const { ctx, engine, fetched } = setup();
    await engine.loadKit('acoustic');
    engine.play('kick');
    const first = ctx.sources[0].buffer;
    engine.setKit('electronic');
    await engine.loadKit('electronic');
    engine.play('kick');
    expect(fetched).toContain('/kits/electronic/kick.wav');
    expect(ctx.sources[1].buffer).not.toBe(first);
  });

  it('fetch lỗi: gọi onError, không ném, không phát', async () => {
    const onError = vi.fn();
    const ctx = createFakeContext();
    const engine = createAudioEngine({
      createContext: () => ctx,
      fetchFn: async () => ({ ok: false, status: 404 }),
      random: () => 0.5,
      baseUrl: '/',
      onError,
    });
    engine.play('kick');
    await engine.loadKit('acoustic').catch(() => {});
    await Promise.resolve();
    expect(onError).toHaveBeenCalled();
    expect(ctx.sources).toHaveLength(0);
  });

  it('dispose đóng context; play sau đó không làm gì', async () => {
    const { ctx, engine } = setup();
    await engine.loadKit('acoustic');
    engine.dispose();
    expect(ctx.close).toHaveBeenCalled();
    engine.play('kick');
    expect(ctx.sources).toHaveLength(0);
  });
});
