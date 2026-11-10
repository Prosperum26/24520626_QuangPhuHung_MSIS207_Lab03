/** AudioContext giả cho test: ghi lại thứ tự lệnh gọi, không phát tiếng. */
export function createFakeAudio() {
  const calls = [];
  const oscillators = [];
  const gains = [];
  const state = { closed: false, resumed: 0 };

  const ctx = {
    currentTime: 0,
    state: 'running',
    destination: { name: 'destination' },
    resume() {
      state.resumed += 1;
      return Promise.resolve();
    },
    close() {
      state.closed = true;
      return Promise.resolve();
    },
    createOscillator() {
      const osc = {
        id: oscillators.length,
        frequency: { setValueAtTime: (f, t) => calls.push(['freq', osc.id, f, t]) },
        connect: () => calls.push(['osc.connect', osc.id]),
        start: (t) => calls.push(['osc.start', osc.id, t]),
        stop: (t) => calls.push(['osc.stop', osc.id, t]),
        disconnect: () => calls.push(['osc.disconnect', osc.id]),
        onended: null,
        /** Giả lập trình duyệt báo oscillator đã dừng. */
        end() {
          osc.onended?.();
        },
      };
      oscillators.push(osc);
      return osc;
    },
    createGain() {
      const id = gains.length;
      const gain = {
        id,
        gain: {
          value: 0,
          setValueAtTime(v, t) {
            gain.gain.value = v;
            calls.push(['gain.set', id, v, t]);
          },
          linearRampToValueAtTime: (v, t) => calls.push(['gain.linear', id, v, t]),
          exponentialRampToValueAtTime: (v, t) => calls.push(['gain.exp', id, v, t]),
          cancelScheduledValues: (t) => calls.push(['gain.cancel', id, t]),
        },
        connect: () => calls.push(['gain.connect', id]),
        disconnect: () => calls.push(['gain.disconnect', id]),
      };
      gains.push(gain);
      return gain;
    },
  };

  return { ctx, calls, oscillators, gains, state };
}
