import { StrictMode } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SituationshipAnalyzer } from './SituationshipAnalyzer.jsx';

function send(actor, steps) {
  fireEvent.change(screen.getByLabelText(/ai nhắn/i), { target: { value: actor } });
  fireEvent.change(screen.getByLabelText(/số bước/i), { target: { value: String(steps) } });
  fireEvent.click(screen.getByRole('button', { name: /gửi tín hiệu/i }));
}
const click = (name) => fireEvent.click(screen.getByRole('button', { name }));
const wait = (ms) => act(() => { vi.advanceTimersByTime(ms); });
const renderStrict = () => render(<StrictMode><SituationshipAnalyzer /></StrictMode>);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('ghosting timer (B-04)', () => {
  it('em nhắn mà không ai rep: đúng 5000ms thì GHOSTED_EXIT', () => {
    renderStrict();
    click(/rủ đi chơi/i);
    send('EM', 3);
    expect(screen.getByRole('status')).toHaveTextContent(/đã xem/i);
    wait(4999);
    expect(screen.getByText('Hẹn hò nhưng không yêu')).toBeInTheDocument();
    wait(1);
    expect(screen.getByText('Đã bị bỏ rơi')).toBeInTheDocument();
  });

  it('ai đó rep trước 5s thì không bị ghost', () => {
    renderStrict();
    click(/rủ đi chơi/i);
    send('EM', 3);
    wait(3000);
    send('AI_DO', 1);
    wait(20000);
    expect(screen.getByText('Hẹn hò nhưng không yêu')).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('em nhắn thêm thì đếm lại từ đầu', () => {
    renderStrict();
    click(/rủ đi chơi/i);
    send('EM', 1);
    wait(3000);
    send('EM', 1);
    wait(4999);
    expect(screen.getByText('Hẹn hò nhưng không yêu')).toBeInTheDocument();
    wait(1);
    expect(screen.getByText('Đã bị bỏ rơi')).toBeInTheDocument();
  });

  it('StrictMode không nhân đôi timer: chỉ một timer đang chạy', () => {
    renderStrict();
    click(/rủ đi chơi/i);
    send('EM', 1);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('nút Dừng Lại dọn timer', () => {
    renderStrict();
    click(/rủ đi chơi/i);
    send('EM', 1);
    click(/dừng lại/i);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('Reset dọn timer', () => {
    renderStrict();
    click(/rủ đi chơi/i);
    send('EM', 1);
    click(/reset/i);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('unmount không để lại timer', () => {
    const { unmount } = renderStrict();
    click(/rủ đi chơi/i);
    send('EM', 1);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('không đếm giờ ở FRIENDS dù em đã nhắn', () => {
    renderStrict();
    send('EM', 1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
