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

  it('click gọi onTrigger với id của pad', () => {
    const onTrigger = vi.fn();
    render(<Pad pad={openHat} isActive={false} onTrigger={onTrigger} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onTrigger).toHaveBeenCalledExactlyOnceWith('openhat');
  });
});
