import { render, fireEvent } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { useDrumKeyboard } from './useDrumKeyboard.js';
import { padMap } from './drumPads.js';

function Harness({ onTrigger, isEnabled }) {
  useDrumKeyboard(padMap, onTrigger, isEnabled);
  return (
    <div>
      <input aria-label="gõ" />
      <textarea aria-label="ghi chú" />
      <select aria-label="chọn">
        <option>a</option>
      </select>
      <div contentEditable suppressContentEditableWarning data-testid="ce" />
    </div>
  );
}

describe('useDrumKeyboard', () => {
  it('dùng e.code: KeyW kích hoạt pad openhat', () => {
    const onTrigger = vi.fn();
    render(<Harness onTrigger={onTrigger} />);
    fireEvent.keyDown(window, { code: 'KeyW', key: 'w' });
    expect(onTrigger).toHaveBeenCalledWith('openhat');
  });

  it('UniKey: key là "ư" nhưng code KeyW vẫn kích hoạt', () => {
    const onTrigger = vi.fn();
    render(<Harness onTrigger={onTrigger} />);
    fireEvent.keyDown(window, { code: 'KeyW', key: 'ư' });
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('không dùng e.key: key "w" nhưng code lạ thì bỏ qua', () => {
    const onTrigger = vi.fn();
    render(<Harness onTrigger={onTrigger} />);
    fireEvent.keyDown(window, { code: 'KeyQ', key: 'w' });
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('giữ phím (repeat) không bắn lặp', () => {
    const onTrigger = vi.fn();
    render(<Harness onTrigger={onTrigger} />);
    fireEvent.keyDown(window, { code: 'KeyA' });
    fireEvent.keyDown(window, { code: 'KeyA', repeat: true });
    fireEvent.keyDown(window, { code: 'KeyA', repeat: true });
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('gõ trong input, textarea, select, contenteditable không kích hoạt', () => {
    const onTrigger = vi.fn();
    const { getByLabelText, getByTestId } = render(<Harness onTrigger={onTrigger} />);
    for (const el of [getByLabelText('gõ'), getByLabelText('ghi chú'), getByLabelText('chọn'), getByTestId('ce')]) {
      fireEvent.keyDown(el, { code: 'KeyA', bubbles: true });
    }
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('bỏ qua tổ hợp Ctrl/Meta/Alt (Ctrl+S, Ctrl+D của trình duyệt)', () => {
    const onTrigger = vi.fn();
    render(<Harness onTrigger={onTrigger} />);
    fireEvent.keyDown(window, { code: 'KeyS', ctrlKey: true });
    fireEvent.keyDown(window, { code: 'KeyD', metaKey: true });
    fireEvent.keyDown(window, { code: 'KeyD', altKey: true });
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('isEnabled=false thì không nghe', () => {
    const onTrigger = vi.fn();
    render(<Harness onTrigger={onTrigger} isEnabled={false} />);
    fireEvent.keyDown(window, { code: 'KeyA' });
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('unmount gỡ listener', () => {
    const onTrigger = vi.fn();
    const { unmount } = render(<Harness onTrigger={onTrigger} />);
    unmount();
    fireEvent.keyDown(window, { code: 'KeyA' });
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('StrictMode không nhân đôi listener', () => {
    const onTrigger = vi.fn();
    render(
      <StrictMode>
        <Harness onTrigger={onTrigger} />
      </StrictMode>,
    );
    fireEvent.keyDown(window, { code: 'KeyA' });
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('removeEventListener được gọi đúng với handler đã đăng ký', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Harness onTrigger={() => {}} />);
    const handler = add.mock.calls.find(([type]) => type === 'keydown')[1];
    unmount();
    expect(remove).toHaveBeenCalledWith('keydown', handler);
    add.mockRestore();
    remove.mockRestore();
  });
});
