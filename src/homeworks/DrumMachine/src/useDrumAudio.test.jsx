import { renderHook, act, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const engines = [];
let engineOptions;
vi.mock('./audioEngine.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    createAudioEngine: (options) => {
      engineOptions = options;
      const engine = {
        prefetch: vi.fn(() => Promise.resolve()),
        play: vi.fn(),
        setKit: vi.fn(),
        setVolume: vi.fn(),
        setMuted: vi.fn(),
        getLevelDb: vi.fn(() => -30),
        now: vi.fn(() => 2),
        dispose: vi.fn(),
      };
      engines.push(engine);
      return engine;
    },
  };
});

const { useDrumAudio } = await import('./useDrumAudio.js');
const last = () => engines[engines.length - 1];

beforeEach(() => {
  engines.length = 0;
});

describe('useDrumAudio', () => {
  it('trigger chuyển padId và when sang engine; tham chiếu ổn định giữa các render', () => {
    const { result, rerender } = renderHook(() => useDrumAudio());
    const first = result.current.trigger;
    act(() => result.current.trigger('kick', { when: 1 }));
    expect(last().play).toHaveBeenCalledWith('kick', { when: 1 });
    rerender();
    expect(result.current.trigger).toBe(first);
  });

  it('prefetch kit mặc định khi trình duyệt rảnh, không đồng bộ lúc mount', async () => {
    renderHook(() => useDrumAudio());
    expect(engines).toHaveLength(0); // engine chưa được tạo
    await waitFor(() => expect(last().prefetch).toHaveBeenCalledWith('acoustic'));
  });

  it('setKit đổi state, báo engine và prefetch kit mới', async () => {
    const { result } = renderHook(() => useDrumAudio());
    act(() => result.current.setKit('electronic'));
    expect(result.current.kit).toBe('electronic');
    expect(last().setKit).toHaveBeenCalledWith('electronic');
    await waitFor(() => expect(last().prefetch).toHaveBeenCalledWith('electronic'));
  });

  it('setVolume và setMuted đổi state và báo engine', () => {
    const { result } = renderHook(() => useDrumAudio());
    act(() => result.current.setVolume(0.25));
    act(() => result.current.setMuted(true));
    expect(result.current.volume).toBe(0.25);
    expect(result.current.muted).toBe(true);
    expect(last().setVolume).toHaveBeenCalledWith(0.25);
    expect(last().setMuted).toHaveBeenCalledWith(true);
  });

  it('getLevelDb và now lấy từ engine', () => {
    const { result } = renderHook(() => useDrumAudio());
    expect(result.current.getLevelDb()).toBe(-30);
    expect(result.current.now()).toBe(2);
  });

  it('unmount trước khi rảnh thì huỷ prefetch, không tạo engine', () => {
    const { unmount } = renderHook(() => useDrumAudio());
    unmount();
    expect(engines).toHaveLength(0);
  });

  it('unmount dispose engine', () => {
    const { result, unmount } = renderHook(() => useDrumAudio());
    act(() => result.current.trigger('kick')); // tạo engine
    const engine = last();
    unmount();
    expect(engine.dispose).toHaveBeenCalled();
  });

  it('StrictMode: engine bị dispose rồi tạo lại vẫn nhận cài đặt hiện tại', () => {
    const { result } = renderHook(() => useDrumAudio(), { wrapper: StrictMode });
    act(() => result.current.setVolume(0.4));
    act(() => result.current.trigger('snare'));
    const live = engines.filter((e) => !e.dispose.mock.calls.length);
    expect(live).toHaveLength(1);
    expect(live[0].play).toHaveBeenCalledWith('snare', undefined);
    expect(live[0].setVolume).toHaveBeenCalledWith(0.4);
  });

  it('lỗi từ engine hiện ra ở error', async () => {
    const { result } = renderHook(() => useDrumAudio());
    expect(result.current.error).toBeNull();
    act(() => result.current.trigger('kick')); // tạo engine
    act(() => engineOptions.onError(new Error('Không tải được kick.wav')));
    await waitFor(() => expect(result.current.error).toBe('Không tải được kick.wav'));
  });

  it('prefetch bị từ chối thì error được đặt, không ném lỗi chưa xử lý', async () => {
    const { result } = renderHook(() => useDrumAudio());
    act(() => result.current.trigger('kick')); // tạo engine
    const failing = last();
    failing.prefetch.mockImplementationOnce(() => Promise.reject(new Error('mất mạng')));
    act(() => result.current.setKit('electronic'));
    await waitFor(() => expect(result.current.error).toBe('mất mạng'));
  });
});
