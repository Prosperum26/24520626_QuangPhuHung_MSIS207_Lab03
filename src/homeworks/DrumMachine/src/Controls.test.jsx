import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Controls } from './Controls.jsx';
import { KITS } from './kits.js';

function setup(props = {}) {
  const handlers = { onKitChange: vi.fn(), onVolumeChange: vi.fn(), onMutedChange: vi.fn() };
  render(<Controls kit="acoustic" volume={0.8} muted={false} {...handlers} {...props} />);
  return handlers;
}

describe('Controls', () => {
  it('mọi ô nhập có label (truy cập được bằng tên)', () => {
    setup();
    expect(screen.getByRole('combobox', { name: 'Bộ trống' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Âm lượng' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Tắt tiếng' })).toBeInTheDocument();
  });

  it('select liệt kê đủ các kit và chọn đúng kit hiện tại', () => {
    setup({ kit: 'electronic' });
    const select = screen.getByRole('combobox', { name: 'Bộ trống' });
    expect([...select.options].map((o) => o.value)).toEqual(KITS.map((k) => k.id));
    expect(select).toHaveValue('electronic');
  });

  it('đổi kit gọi onKitChange với id kit', () => {
    const { onKitChange } = setup();
    fireEvent.change(screen.getByRole('combobox', { name: 'Bộ trống' }), { target: { value: 'electronic' } });
    expect(onKitChange).toHaveBeenCalledExactlyOnceWith('electronic');
  });

  it('âm lượng giữ kiểu số (valueAsNumber), không phải chuỗi', () => {
    const { onVolumeChange } = setup();
    fireEvent.change(screen.getByRole('slider', { name: 'Âm lượng' }), { target: { value: '0.5' } });
    expect(onVolumeChange).toHaveBeenCalledExactlyOnceWith(0.5);
  });

  it('hiện phần trăm âm lượng', () => {
    setup({ volume: 0.35 });
    expect(screen.getByText('35%')).toBeInTheDocument();
  });

  it('đổi tắt tiếng gọi onMutedChange với boolean', () => {
    const { onMutedChange } = setup();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Tắt tiếng' }));
    expect(onMutedChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('muted=true thì checkbox được tick', () => {
    setup({ muted: true });
    expect(screen.getByRole('checkbox', { name: 'Tắt tiếng' })).toBeChecked();
  });
});
