import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DROP_WINDOW_MS } from '../domain/dropPhase.js';
import { CrateCard } from './CrateCard.jsx';

const START = new Date('2026-01-01T00:00:00Z').getTime();

const makeCrate = (overrides = {}) => ({
  id: 'a',
  title: 'PVS Grand Finals VIP Ticket',
  priceVnd: 350000,
  remainingStock: 2,
  dropEpochMs: START + 20_000,
  ...overrides,
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
});
afterEach(() => vi.useRealTimers());

const tick = (ms) => act(() => vi.advanceTimersByTime(ms));

describe('CrateCard', () => {
  it('là article có tên, dl đủ cặp dt/dd, giá VND và không có div', () => {
    const { container } = render(<CrateCard crate={makeCrate()} reserveCrate={vi.fn()} />);
    expect(screen.getByRole('article', { name: 'PVS Grand Finals VIP Ticket' })).toBeInTheDocument();
    expect(container.querySelectorAll('dl dt')).toHaveLength(3);
    expect(container.querySelectorAll('dl dd')).toHaveLength(3);
    expect(container.querySelector('dl')).toHaveTextContent(/350\.000/);
    expect(container.querySelector('div')).toBeNull();
  });

  it('WARMUP: đếm ngược trong <output>, nút Claim disabled kèm lý do bằng chữ', () => {
    render(<CrateCard crate={makeCrate()} reserveCrate={vi.fn()} />);
    expect(screen.getByText('00:20').tagName).toBe('OUTPUT');
    const button = screen.getByRole('button', { name: 'Claim' });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription('Chưa tới giờ drop.');
    expect(screen.getByText('Sắp mở')).toBeInTheDocument();
  });

  it('tới giờ drop: chuyển AIRDROP_LIVE và bật nút Claim', () => {
    render(<CrateCard crate={makeCrate()} reserveCrate={vi.fn()} />);
    tick(20_000);
    expect(screen.getByText('Đang mở')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Claim' })).toBeEnabled();
  });

  it('hết hàng khi đã tới giờ: disabled kèm lý do', () => {
    render(<CrateCard crate={makeCrate({ remainingStock: 0 })} reserveCrate={vi.fn()} />);
    tick(20_000);
    expect(screen.getByText('Hết hàng')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Claim' })).toHaveAccessibleDescription('Crate đã hết hàng.');
  });

  it('quá thời hạn: EXPIRED và nút disabled', () => {
    render(<CrateCard crate={makeCrate()} reserveCrate={vi.fn()} />);
    tick(20_000 + DROP_WINDOW_MS);
    expect(screen.getByText('Đã đóng')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Claim' })).toBeDisabled();
  });

  it('Claim thành công: kho giảm, role="status" báo bằng chữ', async () => {
    const reserveCrate = vi.fn().mockResolvedValue({ status: 200, remainingStock: 1 });
    render(<CrateCard crate={makeCrate()} reserveCrate={reserveCrate} />);
    tick(20_000);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Claim' })); });
    expect(screen.getByText('Đã giữ chỗ thành công.')).toHaveAttribute('role', 'status');
    expect(screen.getByText('1', { selector: 'dd' })).toBeInTheDocument();
  });

  it('409: kho trở lại giá trị cũ và hiện role="alert"', async () => {
    const reserveCrate = vi.fn().mockResolvedValue({ status: 409, message: 'Looted Out' });
    render(<CrateCard crate={makeCrate()} reserveCrate={reserveCrate} />);
    tick(20_000);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Claim' })); });
    expect(screen.getByRole('alert')).toHaveTextContent('Crate đã bị lấy hết');
    expect(screen.getByText('2', { selector: 'dd' })).toBeInTheDocument();
  });

  it('bấm đúp nhanh chỉ gửi một request; trong lúc chờ nút disabled "Đang giữ chỗ..."', () => {
    const reserveCrate = vi.fn(() => new Promise(() => {}));
    render(<CrateCard crate={makeCrate()} reserveCrate={reserveCrate} />);
    tick(20_000);
    const button = screen.getByRole('button', { name: 'Claim' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(reserveCrate).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription('Đang giữ chỗ...');
  });
});
