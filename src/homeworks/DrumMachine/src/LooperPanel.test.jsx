import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LooperPanel } from './LooperPanel.jsx';

function makeLooper(overrides = {}) {
  return {
    mode: 'empty',
    loopMode: 'loop',
    setLoopMode: vi.fn(),
    speed: 1,
    setSpeed: vi.fn(),
    progress: 0,
    record: vi.fn(),
    togglePlay: vi.fn(),
    toggleOverdub: vi.fn(),
    clear: vi.fn(),
    ...overrides,
  };
}

const button = (name) => screen.getByRole('button', { name });

describe('LooperPanel', () => {
  it('là vùng có tên; mọi nút có type="button"', () => {
    render(<LooperPanel looper={makeLooper()} />);
    expect(screen.getByRole('region', { name: 'Looper' })).toBeInTheDocument();
    screen.getAllByRole('button').forEach((b) => expect(b).toHaveAttribute('type', 'button'));
  });

  it('vùng trạng thái role="status" có sẵn từ đầu và đổi chữ theo mode', () => {
    const { rerender } = render(<LooperPanel looper={makeLooper()} />);
    const status = screen.getByRole('status');
    expect(status.tagName).toBe('P');
    expect(status).toHaveTextContent('Chưa có bản ghi');
    rerender(<LooperPanel looper={makeLooper({ mode: 'recording' })} />);
    expect(screen.getByRole('status')).toBe(status); // cùng một phần tử, không bị tạo lại
    expect(status).toHaveTextContent('Đang ghi');
    rerender(<LooperPanel looper={makeLooper({ mode: 'playing' })} />);
    expect(status).toHaveTextContent('Đang lặp');
    rerender(<LooperPanel looper={makeLooper({ mode: 'playing', loopMode: 'once' })} />);
    expect(status).toHaveTextContent('một lần');
    rerender(<LooperPanel looper={makeLooper({ mode: 'overdubbing' })} />);
    expect(status).toHaveTextContent('chồng lớp');
    rerender(<LooperPanel looper={makeLooper({ mode: 'ready' })} />);
    expect(status).toHaveTextContent('Đã dừng');
  });

  it.each([
    ['empty', { Ghi: true, 'Chồng lớp': false, Phát: false, Xoá: false }],
    ['recording', { Ghi: true, 'Chồng lớp': false, Phát: false, Xoá: true }],
    ['playing', { Ghi: false, 'Chồng lớp': true, Dừng: true, Xoá: true }],
    ['overdubbing', { Ghi: false, 'Chồng lớp': true, Dừng: true, Xoá: true }],
    ['ready', { Ghi: false, 'Chồng lớp': false, Phát: true, Xoá: true }],
  ])('mode %s: nút nào bấm được', (mode, expected) => {
    render(<LooperPanel looper={makeLooper({ mode })} />);
    for (const [name, enabled] of Object.entries(expected)) {
      const el = button(name);
      if (enabled) expect(el).toBeEnabled();
      else expect(el).toBeDisabled();
    }
  });

  it('Ghi và Chồng lớp dùng aria-pressed theo trạng thái', () => {
    const { rerender } = render(<LooperPanel looper={makeLooper({ mode: 'recording' })} />);
    expect(button('Ghi')).toHaveAttribute('aria-pressed', 'true');
    rerender(<LooperPanel looper={makeLooper({ mode: 'playing' })} />);
    expect(button('Chồng lớp')).toHaveAttribute('aria-pressed', 'false');
    rerender(<LooperPanel looper={makeLooper({ mode: 'overdubbing' })} />);
    expect(button('Chồng lớp')).toHaveAttribute('aria-pressed', 'true');
  });

  it('bấm nút gọi đúng hàm của looper', () => {
    const looper = makeLooper({ mode: 'playing' });
    render(<LooperPanel looper={looper} />);
    fireEvent.click(button('Chồng lớp'));
    fireEvent.click(button('Dừng'));
    fireEvent.click(button('Xoá'));
    expect(looper.toggleOverdub).toHaveBeenCalledTimes(1);
    expect(looper.togglePlay).toHaveBeenCalledTimes(1);
    expect(looper.clear).toHaveBeenCalledTimes(1);

    const empty = makeLooper();
    render(<LooperPanel looper={empty} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Ghi' })[1]);
    expect(empty.record).toHaveBeenCalledTimes(1);
  });

  it('chế độ phát là nhóm radio có legend; đổi gọi setLoopMode', () => {
    const looper = makeLooper();
    render(<LooperPanel looper={looper} />);
    const group = screen.getByRole('group', { name: 'Chế độ phát' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Lặp liên tục' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'Một lần' }));
    expect(looper.setLoopMode).toHaveBeenCalledWith('once');
  });

  it('tốc độ: slider có label, giữ kiểu số, hiện hệ số', () => {
    const looper = makeLooper({ speed: 1.5 });
    render(<LooperPanel looper={looper} />);
    const slider = screen.getByRole('slider', { name: 'Tốc độ' });
    expect(slider).toHaveAttribute('min', '0.5');
    expect(slider).toHaveAttribute('max', '2');
    expect(screen.getByText('1.5×')).toBeInTheDocument();
    fireEvent.change(slider, { target: { value: '0.75' } });
    expect(looper.setSpeed).toHaveBeenCalledExactlyOnceWith(0.75);
  });

  it('progress có nhãn và giá trị', () => {
    render(<LooperPanel looper={makeLooper({ mode: 'playing', progress: 40 })} />);
    const bar = screen.getByRole('progressbar', { name: 'Vị trí trong vòng' });
    expect(bar).toHaveAttribute('value', '40');
    expect(bar).toHaveAttribute('max', '100');
  });
});
