import { render, screen, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HitLog } from './HitLog.jsx';
import { ANNOUNCE_MS } from './drumPads.js';

const hit = (id, padId) => ({ id, padId });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('HitLog', () => {
  it('vùng live là <output aria-live="polite" aria-atomic="true">, có sẵn từ đầu', () => {
    render(<HitLog hits={[]} />);
    const live = screen.getByRole('status');
    expect(live.tagName).toBe('OUTPUT');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveAttribute('aria-atomic', 'true');
    expect(live).toHaveTextContent('');
  });

  it('chưa có hit thì hiện lời mời, không có danh sách', () => {
    render(<HitLog hits={[]} />);
    expect(screen.getByText(/Chưa có cú gõ nào/)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('danh sách hiện ngay, mới nhất trước, có tên và phím', () => {
    render(<HitLog hits={[hit(2, 'snare'), hit(1, 'kick')]} />);
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual(['Snare S', 'Kick A']);
  });

  it('vùng live chưa đọc ngay; đọc sau ANNOUNCE_MS', () => {
    const { rerender } = render(<HitLog hits={[]} />);
    rerender(<HitLog hits={[hit(1, 'kick')]} />);
    expect(screen.getByRole('status')).toHaveTextContent('');
    act(() => vi.advanceTimersByTime(ANNOUNCE_MS));
    expect(screen.getByRole('status')).toHaveTextContent('Kick, phím A');
  });

  it('gõ dồn dập: gộp thành một câu duy nhất', () => {
    const { rerender } = render(<HitLog hits={[]} />);
    rerender(<HitLog hits={[hit(1, 'kick')]} />);
    act(() => vi.advanceTimersByTime(100));
    rerender(<HitLog hits={[hit(2, 'snare'), hit(1, 'kick')]} />);
    act(() => vi.advanceTimersByTime(100));
    rerender(<HitLog hits={[hit(3, 'hihat'), hit(2, 'snare'), hit(1, 'kick')]} />);
    act(() => vi.advanceTimersByTime(ANNOUNCE_MS - 1));
    expect(screen.getByRole('status')).toHaveTextContent('');
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('status')).toHaveTextContent('3 cú gõ, cuối cùng: Hi-Hat');
  });

  it('đợt sau chỉ đếm hit mới kể từ lần đọc trước', () => {
    const { rerender } = render(<HitLog hits={[hit(1, 'kick')]} />);
    act(() => vi.advanceTimersByTime(ANNOUNCE_MS));
    rerender(<HitLog hits={[hit(2, 'tom'), hit(1, 'kick')]} />);
    act(() => vi.advanceTimersByTime(ANNOUNCE_MS));
    expect(screen.getByRole('status')).toHaveTextContent('Tom, phím J');
  });

  it('unmount huỷ timer đọc', () => {
    const { rerender, unmount } = render(<HitLog hits={[]} />);
    rerender(<HitLog hits={[hit(1, 'kick')]} />);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
