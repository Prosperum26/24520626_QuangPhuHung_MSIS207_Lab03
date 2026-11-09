import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pad } from './Pad.jsx';
import { padMap } from './drumPads.js';

const openHat = padMap.get('KeyW');

describe('Pad', () => {
  it('là button type="button" có tên gồm nhãn và phím', () => {
    render(<Pad pad={openHat} isActive={false} onTrigger={() => {}} />);
    const button = screen.getByRole('button', { name: /Open Hat/ });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAccessibleName('Open Hat W');
    expect(button).toHaveAttribute('aria-keyshortcuts', 'W');
  });

  it('aria-pressed phản ánh isActive', () => {
    const { rerender } = render(<Pad pad={openHat} isActive={false} onTrigger={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    rerender(<Pad pad={openHat} isActive onTrigger={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('có data-sound để CSS chọn hình và animation riêng', () => {
    render(<Pad pad={openHat} isActive={false} onTrigger={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-sound', 'openhat');
  });

  it('mỗi hit mới (hitId đổi) tạo lại phần tử hình để animation chạy lại từ đầu', () => {
    const { container, rerender } = render(<Pad pad={openHat} isActive={false} onTrigger={() => {}} />);
    const idle = container.querySelector('[aria-hidden="true"]');
    expect(idle.className).not.toMatch(/hit/);

    rerender(<Pad pad={openHat} isActive hitId={1} onTrigger={() => {}} />);
    const first = container.querySelector('[aria-hidden="true"]');
    expect(first).not.toBe(idle);
    expect(first.className).toMatch(/hit/);

    rerender(<Pad pad={openHat} isActive hitId={2} onTrigger={() => {}} />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBe(first);
  });

  it('cùng hitId thì giữ nguyên phần tử (re-render khác không làm animation chạy lại)', () => {
    const { container, rerender } = render(<Pad pad={openHat} isActive hitId={5} onTrigger={() => {}} />);
    const shape = container.querySelector('[aria-hidden="true"]');
    rerender(<Pad pad={openHat} isActive={false} hitId={5} onTrigger={() => {}} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBe(shape);
  });

  it('click gọi onTrigger với id của pad', () => {
    const onTrigger = vi.fn();
    render(<Pad pad={openHat} isActive={false} onTrigger={onTrigger} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onTrigger).toHaveBeenCalledExactlyOnceWith('openhat');
  });
});
