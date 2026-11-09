import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ACTIVE_MS, LOG_MAX, PADS } from './drumPads.js';

const audio = vi.hoisted(() => ({ trigger: vi.fn(), error: null }));
vi.mock('./useDrumAudio.js', () => ({ useDrumAudio: () => audio }));

const { DrumMachine } = await import('./DrumMachine.jsx');

const pad = (name) => screen.getByRole('button', { name });

beforeEach(() => {
  vi.useFakeTimers();
  audio.trigger.mockClear();
  audio.error = null;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DrumMachine', () => {
  it('render 7 pad, mặc định chưa pad nào pressed', () => {
    render(<DrumMachine />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(PADS.length);
    buttons.forEach((b) => expect(b).toHaveAttribute('aria-pressed', 'false'));
  });

  it('phím W: phát tiếng, pad Open Hat pressed rồi về false sau ACTIVE_MS', () => {
    render(<DrumMachine />);
    fireEvent.keyDown(window, { code: 'KeyW' });
    expect(audio.trigger).toHaveBeenCalledExactlyOnceWith('openhat');
    expect(pad(/Open Hat/)).toHaveAttribute('aria-pressed', 'true');
    act(() => vi.advanceTimersByTime(ACTIVE_MS - 1));
    expect(pad(/Open Hat/)).toHaveAttribute('aria-pressed', 'true');
    act(() => vi.advanceTimersByTime(1));
    expect(pad(/Open Hat/)).toHaveAttribute('aria-pressed', 'false');
  });

  it('click chuột cũng phát tiếng và làm pad pressed', () => {
    render(<DrumMachine />);
    fireEvent.click(pad(/Kick/));
    expect(audio.trigger).toHaveBeenCalledWith('kick');
    expect(pad(/Kick/)).toHaveAttribute('aria-pressed', 'true');
  });

  it('hit lại trong lúc đang sáng thì tính lại thời hạn, không bị timer cũ cắt ngang', () => {
    render(<DrumMachine />);
    fireEvent.keyDown(window, { code: 'KeyA' });
    act(() => vi.advanceTimersByTime(ACTIVE_MS - 20));
    fireEvent.keyDown(window, { code: 'KeyA' });
    act(() => vi.advanceTimersByTime(30)); // quá hạn của hit đầu
    expect(pad(/Kick/)).toHaveAttribute('aria-pressed', 'true');
    act(() => vi.advanceTimersByTime(ACTIVE_MS));
    expect(pad(/Kick/)).toHaveAttribute('aria-pressed', 'false');
  });

  it('nhiều pad sáng cùng lúc, mỗi pad tắt theo timer riêng', () => {
    render(<DrumMachine />);
    fireEvent.keyDown(window, { code: 'KeyA' });
    act(() => vi.advanceTimersByTime(50));
    fireEvent.keyDown(window, { code: 'KeyS' });
    expect(pad(/Kick/)).toHaveAttribute('aria-pressed', 'true');
    expect(pad(/Snare/)).toHaveAttribute('aria-pressed', 'true');
    act(() => vi.advanceTimersByTime(ACTIVE_MS - 50));
    expect(pad(/Kick/)).toHaveAttribute('aria-pressed', 'false');
    expect(pad(/Snare/)).toHaveAttribute('aria-pressed', 'true');
  });

  it('giữ phím (repeat) chỉ phát một lần', () => {
    render(<DrumMachine />);
    fireEvent.keyDown(window, { code: 'KeyD' });
    fireEvent.keyDown(window, { code: 'KeyD', repeat: true });
    expect(audio.trigger).toHaveBeenCalledTimes(1);
  });

  it('UniKey: key "ư" nhưng code KeyW vẫn chơi đúng pad', () => {
    render(<DrumMachine />);
    fireEvent.keyDown(window, { code: 'KeyW', key: 'ư' });
    expect(audio.trigger).toHaveBeenCalledWith('openhat');
  });

  it('unmount không để lại timer nào', () => {
    const { unmount } = render(<DrumMachine />);
    fireEvent.keyDown(window, { code: 'KeyA' });
    fireEvent.keyDown(window, { code: 'KeyS' });
    // 2 timer tắt sáng của pad + 1 timer đọc của nhật ký
    expect(vi.getTimerCount()).toBe(3);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('StrictMode không nhân đôi hit', () => {
    render(
      <StrictMode>
        <DrumMachine />
      </StrictMode>,
    );
    fireEvent.keyDown(window, { code: 'KeyJ' });
    expect(audio.trigger).toHaveBeenCalledTimes(1);
  });

  it('mỗi hit vào nhật ký, mới nhất trước, tối đa LOG_MAX', () => {
    render(<DrumMachine />);
    fireEvent.keyDown(window, { code: 'KeyA' });
    fireEvent.click(pad(/Snare/));
    let items = within(screen.getByRole('list', { name: /Lịch sử gõ/ })).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual(['Snare S', 'Kick A']);

    for (let n = 0; n < LOG_MAX + 3; n++) fireEvent.keyDown(window, { code: 'KeyL' });
    items = within(screen.getByRole('list', { name: /Lịch sử gõ/ })).getAllByRole('listitem');
    expect(items).toHaveLength(LOG_MAX);
  });

  it('có lỗi âm thanh thì hiện role="alert"', () => {
    audio.error = 'Không tải được kick.wav';
    render(<DrumMachine />);
    expect(screen.getByRole('alert')).toHaveTextContent('Không tải được kick.wav');
  });

  it('không có lỗi thì không có alert', () => {
    render(<DrumMachine />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
