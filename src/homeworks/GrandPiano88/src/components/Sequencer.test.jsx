import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Sequencer } from './Sequencer.jsx';

const baseProps = (over = {}) => ({
  status: 'idle',
  count: 0,
  speed: 1,
  message: 'Sẵn sàng',
  onRecord: vi.fn(),
  onStopRecord: vi.fn(),
  onPlay: vi.fn(),
  onStop: vi.fn(),
  onSpeedChange: vi.fn(),
  ...over,
});

describe('Sequencer', () => {
  it('là section có tên, vùng role="status" và mọi nút có type="button"', () => {
    render(<Sequencer {...baseProps()} />);
    expect(screen.getByRole('region', { name: 'Ghi và phát lại' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Sẵn sàng');
    for (const b of screen.getAllByRole('button')) expect(b).toHaveAttribute('type', 'button');
  });

  it('tốc độ là nhóm radio có legend, mỗi radio có nhãn: 0,5x / 1x / 2x', () => {
    render(<Sequencer {...baseProps({ speed: 2 })} />);
    const group = screen.getByRole('group', { name: 'Tốc độ phát' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((r) => r.labels[0].textContent)).toEqual(['0,5x', '1x', '2x']);
    expect(screen.getByRole('radio', { name: '2x' })).toBeChecked();
  });

  it('chọn tốc độ gọi onSpeedChange với số (không phải chuỗi)', () => {
    const props = baseProps();
    render(<Sequencer {...props} />);
    fireEvent.click(screen.getByRole('radio', { name: '0,5x' }));
    expect(props.onSpeedChange).toHaveBeenCalledWith(0.5);
  });

  it('Ghi gọi onRecord khi idle và onStopRecord khi đang ghi', () => {
    const idle = baseProps();
    const { rerender } = render(<Sequencer {...idle} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ghi' }));
    expect(idle.onRecord).toHaveBeenCalledTimes(1);

    const recording = baseProps({ status: 'recording' });
    rerender(<Sequencer {...recording} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ghi' }));
    expect(recording.onStopRecord).toHaveBeenCalledTimes(1);
  });

  it('Phát cần có bản ghi; Dừng chỉ bật khi đang phát', () => {
    const { rerender } = render(<Sequencer {...baseProps({ count: 0 })} />);
    expect(screen.getByRole('button', { name: 'Phát' })).toBeDisabled();
    rerender(<Sequencer {...baseProps({ count: 3 })} />);
    expect(screen.getByRole('button', { name: 'Phát' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Dừng' })).toBeDisabled();
    rerender(<Sequencer {...baseProps({ count: 3, status: 'playing' })} />);
    expect(screen.getByRole('button', { name: 'Dừng' })).toBeEnabled();
  });
});
