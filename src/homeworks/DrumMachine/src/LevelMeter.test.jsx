import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LevelMeter, levelLabel } from './LevelMeter.jsx';
import { METER_INTERVAL_MS, METER_SEGMENTS } from './drumPads.js';
import { SILENCE_DB } from './audioEngine.js';

let frames;
let nextId;
const cancel = vi.fn();

beforeEach(() => {
  frames = new Map();
  nextId = 0;
  cancel.mockClear();
  vi.stubGlobal('requestAnimationFrame', (cb) => {
    nextId += 1;
    frames.set(nextId, cb);
    return nextId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id) => {
    cancel(id);
    frames.delete(id);
  });
});

afterEach(() => vi.unstubAllGlobals());

/** Chạy một frame với thời điểm `time` (ms). */
function frame(time) {
  act(() => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((cb) => cb(time));
  });
}

const litCount = (container) => container.querySelectorAll('[data-lit="true"]').length;

describe('levelLabel', () => {
  it('ánh xạ dB sang chữ theo ngưỡng', () => {
    expect(levelLabel(-6)).toBe('Rất lớn');
    expect(levelLabel(-18)).toBe('Lớn');
    expect(levelLabel(-30)).toBe('Vừa');
    expect(levelLabel(-50)).toBe('Nhỏ');
    expect(levelLabel(SILENCE_DB)).toBe('Im lặng');
  });
});

describe('LevelMeter', () => {
  it('ban đầu im lặng, không vạch nào sáng, có tiêu đề', () => {
    const { container } = render(<LevelMeter getLevelDb={() => SILENCE_DB} />);
    expect(screen.getByRole('region', { name: 'Mức âm' })).toBeInTheDocument();
    expect(screen.getByText('Im lặng')).toBeInTheDocument();
    expect(litCount(container)).toBe(0);
    expect(container.querySelectorAll('[data-lit]')).toHaveLength(METER_SEGMENTS);
  });

  it('đọc mức từ engine: có số dB, chữ mức, số vạch tương ứng', () => {
    const { container } = render(<LevelMeter getLevelDb={() => -18.4} />);
    frame(METER_INTERVAL_MS);
    expect(screen.getByText('−18 dB')).toBeInTheDocument();
    expect(screen.getByText('Lớn')).toBeInTheDocument();
    expect(litCount(container)).toBe(Math.round(((-18 - SILENCE_DB) / -SILENCE_DB) * METER_SEGMENTS));
  });

  it('không cập nhật nhanh hơn METER_INTERVAL_MS', () => {
    let db = -30;
    render(<LevelMeter getLevelDb={() => db} />);
    frame(METER_INTERVAL_MS);
    expect(screen.getByText('−30 dB')).toBeInTheDocument();
    db = -10;
    frame(METER_INTERVAL_MS + 16);
    expect(screen.getByText('−30 dB')).toBeInTheDocument();
    frame(METER_INTERVAL_MS * 2);
    expect(screen.getByText('−10 dB')).toBeInTheDocument();
  });

  it('vạch thanh meter ẩn với trình đọc màn hình; chữ thì không', () => {
    const { container } = render(<LevelMeter getLevelDb={() => SILENCE_DB} />);
    expect(container.querySelector('[data-lit]').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('meter không phải vùng live (tránh đọc liên tục)', () => {
    const { container } = render(<LevelMeter getLevelDb={() => SILENCE_DB} />);
    expect(container.querySelector('[aria-live]')).toBeNull();
  });

  it('unmount huỷ requestAnimationFrame', () => {
    const { unmount } = render(<LevelMeter getLevelDb={() => SILENCE_DB} />);
    frame(16);
    const pendingId = [...frames.keys()][0];
    unmount();
    expect(cancel).toHaveBeenCalledWith(pendingId);
    expect(frames.size).toBe(0);
  });
});
