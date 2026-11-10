import { StrictMode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePiano } from './usePiano.js';
import { createFakeAudio } from './audio/fakeAudio.js';

function setup(options = {}, wrapper) {
  const audio = createFakeAudio();
  const hook = renderHook(() => usePiano({ createContext: () => audio.ctx, ...options }), { wrapper });
  return { ...hook, audio };
}

describe('usePiano', () => {
  it('onSteal của cha được gọi với đúng midi bị cướp', () => {
    const onSteal = vi.fn();
    const { result } = setup({ onSteal });
    for (let midi = 60; midi < 69; midi += 1) act(() => result.current.press(midi));
    expect(onSteal).toHaveBeenCalledTimes(1);
    expect(onSteal).toHaveBeenCalledWith(60);
  });

  it('press: phát đúng tần số và thêm vào pressed', () => {
    const { result, audio } = setup();
    act(() => result.current.press(69));
    expect(result.current.pressed.has(69)).toBe(true);
    expect(audio.calls).toContainEqual(['freq', 0, 440, 0]);
  });

  it('release: bỏ khỏi pressed và tắt dần', () => {
    const { result, audio } = setup();
    act(() => result.current.press(60));
    act(() => result.current.release(60));
    expect(result.current.pressed.size).toBe(0);
    expect(audio.calls.some((c) => c[0] === 'osc.stop')).toBe(true);
  });

  it('pressed là Set mới mỗi lần đổi (bất biến), không sửa Set cũ', () => {
    const { result } = setup();
    act(() => result.current.press(60));
    const before = result.current.pressed;
    act(() => result.current.press(62));
    expect(result.current.pressed).not.toBe(before);
    expect(before.has(62)).toBe(false);
  });

  it('release một phím không đang nhấn thì giữ nguyên Set (không render thừa)', () => {
    const { result } = setup();
    act(() => result.current.press(60));
    const before = result.current.pressed;
    act(() => result.current.release(99));
    expect(result.current.pressed).toBe(before);
  });

  it('nhấn 9 phím: phím đầu hết sáng (onSteal), 8 phím còn lại vẫn sáng', () => {
    const { result } = setup();
    for (let midi = 60; midi < 69; midi += 1) act(() => result.current.press(midi));
    expect(result.current.pressed.has(60)).toBe(false);
    expect([...result.current.pressed].toSorted()).toEqual([61, 62, 63, 64, 65, 66, 67, 68]);
  });

  it('maxVoices tuỳ chỉnh (4): phím thứ 5 cướp phím đầu', () => {
    const { result } = setup({ maxVoices: 4 });
    for (let midi = 60; midi < 65; midi += 1) act(() => result.current.press(midi));
    expect(result.current.pressed.size).toBe(4);
    expect(result.current.pressed.has(60)).toBe(false);
  });

  it('cửa sổ mất focus (blur) thì nhả hết', () => {
    const { result, audio } = setup();
    act(() => result.current.press(60));
    act(() => result.current.press(64));
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(result.current.pressed.size).toBe(0);
    expect(audio.calls.filter((c) => c[0] === 'osc.stop')).toHaveLength(2);
  });

  it('unmount: đóng AudioContext và gỡ listener blur', () => {
    const { result, unmount, audio } = setup();
    act(() => result.current.press(60));
    unmount();
    expect(audio.state.closed).toBe(true);
    expect(() => window.dispatchEvent(new Event('blur'))).not.toThrow();
  });

  it('press/release/releaseAll giữ nguyên tham chiếu qua các lần render (cần cho memo)', () => {
    const { result } = setup();
    const { press, release, releaseAll } = result.current;
    act(() => result.current.press(60));
    act(() => result.current.press(62));
    expect(result.current.press).toBe(press);
    expect(result.current.release).toBe(release);
    expect(result.current.releaseAll).toBe(releaseAll);
  });

  it('StrictMode (cleanup rồi mount lại) vẫn phát được và không đóng context đang dùng', () => {
    const { result, audio } = setup({}, StrictMode);
    act(() => result.current.press(60));
    expect(audio.calls.some((c) => c[0] === 'osc.start')).toBe(true);
    expect(audio.state.closed).toBe(false);
  });
});
