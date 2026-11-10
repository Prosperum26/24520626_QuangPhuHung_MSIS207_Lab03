import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PianoKey } from './PianoKey.jsx';
import { spokenName } from '../music/notes.js';

// Mỗi lần PianoKey render, nó gọi spokenName đúng một lần: dùng làm bộ đếm render.
// (Không dùng <Profiler> bọc ngoài: chính Profiler render lại cùng cha nên onRender luôn chạy.)
vi.mock('../music/notes.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, spokenName: vi.fn(original.spokenName) };
});

const baseProps = (over = {}) => ({
  midi: 60,
  noteName: 'C4',
  isBlack: false,
  pitchClass: 0,
  isPressed: false,
  tabbable: false,
  onNoteOn: vi.fn(),
  onNoteOff: vi.fn(),
  onMoveFocus: vi.fn(),
  ...over,
});

describe('PianoKey: ngữ nghĩa', () => {
  it('là button type="button" có tên đọc được và aria-pressed', () => {
    render(<PianoKey {...baseProps({ midi: 61, noteName: 'C#4', isBlack: true, pitchClass: 1 })} />);
    const key = screen.getByRole('button', { name: 'C thăng 4' });
    expect(key).toHaveAttribute('type', 'button');
    expect(key).toHaveAttribute('aria-pressed', 'false');
    expect(key).toHaveAttribute('data-pc', '1');
  });

  it('isPressed phản ánh vào aria-pressed', () => {
    render(<PianoKey {...baseProps({ isPressed: true })} />);
    expect(screen.getByRole('button', { name: 'C4' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('chữ hiển thị trùng tên trong accessible name (WCAG 2.5.3)', () => {
    render(<PianoKey {...baseProps()} />);
    const key = screen.getByRole('button');
    expect(key).toHaveTextContent('C4');
    expect(key).toHaveAccessibleName('C4');
  });

  it('phím trắng không phải C và phím đen không có chữ', () => {
    const { rerender } = render(<PianoKey {...baseProps({ midi: 62, noteName: 'D4', pitchClass: 2 })} />);
    expect(screen.getByRole('button')).toBeEmptyDOMElement();
    rerender(<PianoKey {...baseProps({ midi: 61, noteName: 'C#4', isBlack: true, pitchClass: 1 })} />);
    expect(screen.getByRole('button')).toBeEmptyDOMElement();
  });

  it('roving tabindex: tabbable ? 0 : -1', () => {
    const { rerender } = render(<PianoKey {...baseProps({ tabbable: true })} />);
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
    rerender(<PianoKey {...baseProps({ tabbable: false })} />);
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '-1');
  });
});

describe('PianoKey: chuột và cảm ứng', () => {
  it('pointerdown gọi onNoteOn(midi) đúng 1 lần', () => {
    const props = baseProps();
    render(<PianoKey {...props} />);
    fireEvent.pointerDown(screen.getByRole('button'), { button: 0 });
    expect(props.onNoteOn).toHaveBeenCalledTimes(1);
    expect(props.onNoteOn).toHaveBeenCalledWith(60);
  });

  it('chuột phải/giữa không nhấn phím', () => {
    const props = baseProps();
    render(<PianoKey {...props} />);
    fireEvent.pointerDown(screen.getByRole('button'), { button: 2 });
    expect(props.onNoteOn).not.toHaveBeenCalled();
  });

  it.each(['pointerUp', 'pointerLeave', 'pointerCancel'])('%s gọi onNoteOff(midi) (không thì phím kẹt)', (name) => {
    const props = baseProps();
    render(<PianoKey {...props} />);
    fireEvent[name](screen.getByRole('button'));
    expect(props.onNoteOff).toHaveBeenCalledWith(60);
  });

  it('mất focus (blur) khi đang giữ thì nhả', () => {
    const props = baseProps();
    render(<PianoKey {...props} />);
    const key = screen.getByRole('button');
    key.focus();
    key.blur();
    expect(props.onNoteOff).toHaveBeenCalledWith(60);
  });
});

describe('PianoKey: bàn phím (WCAG 2.1.1)', () => {
  it('Space: keydown nhấn, keyup nhả', () => {
    const props = baseProps();
    render(<PianoKey {...props} />);
    const key = screen.getByRole('button');
    fireEvent.keyDown(key, { code: 'Space' });
    expect(props.onNoteOn).toHaveBeenCalledWith(60);
    fireEvent.keyUp(key, { code: 'Space' });
    expect(props.onNoteOff).toHaveBeenCalledWith(60);
  });

  it('Enter cũng nhấn', () => {
    const props = baseProps();
    render(<PianoKey {...props} />);
    fireEvent.keyDown(screen.getByRole('button'), { code: 'Enter' });
    expect(props.onNoteOn).toHaveBeenCalledTimes(1);
  });

  it('giữ phím (e.repeat) không bắn noteOn lặp', () => {
    const props = baseProps();
    render(<PianoKey {...props} />);
    const key = screen.getByRole('button');
    fireEvent.keyDown(key, { code: 'Space' });
    fireEvent.keyDown(key, { code: 'Space', repeat: true });
    fireEvent.keyDown(key, { code: 'Space', repeat: true });
    expect(props.onNoteOn).toHaveBeenCalledTimes(1);
  });

  it('Space bị preventDefault (không cuộn trang)', () => {
    render(<PianoKey {...baseProps()} />);
    const notCancelled = fireEvent.keyDown(screen.getByRole('button'), { code: 'Space' });
    expect(notCancelled).toBe(false);
  });

  it.each(['ArrowLeft', 'ArrowRight', 'Home', 'End'])('%s gọi onMoveFocus(midi, code)', (code) => {
    const props = baseProps();
    render(<PianoKey {...props} />);
    fireEvent.keyDown(screen.getByRole('button'), { code });
    expect(props.onMoveFocus).toHaveBeenCalledWith(60, code);
    expect(props.onNoteOn).not.toHaveBeenCalled();
  });

  it('phím khác (ví dụ KeyA) bị bỏ qua', () => {
    const props = baseProps();
    render(<PianoKey {...props} />);
    fireEvent.keyDown(screen.getByRole('button'), { code: 'KeyA' });
    expect(props.onNoteOn).not.toHaveBeenCalled();
    expect(props.onMoveFocus).not.toHaveBeenCalled();
  });
});

describe('PianoKey: memo cô lập render', () => {
  const KEYS = [60, 61, 62];
  const noop = () => {};
  const renderedMidis = () => spokenName.mock.calls.map((call) => call[0]).toSorted();

  function Harness({ pressedMidi, handlers }) {
    return KEYS.map((midi) => (
      <PianoKey
        key={midi}
        midi={midi}
        noteName={`N${midi}`}
        isBlack={false}
        pitchClass={midi % 12}
        isPressed={midi === pressedMidi}
        tabbable={false}
        onNoteOn={handlers.on}
        onNoteOff={handlers.off}
        onMoveFocus={handlers.move}
      />
    ));
  }

  it('đổi isPressed của một phím thì chỉ phím đó render lại', () => {
    const handlers = { on: noop, off: noop, move: noop };
    const { rerender } = render(<Harness pressedMidi={null} handlers={handlers} />);
    expect(renderedMidis()).toEqual([60, 61, 62]); // lần mount: cả ba
    spokenName.mockClear();

    rerender(<Harness pressedMidi={61} handlers={handlers} />);
    expect(renderedMidis()).toEqual([61]);

    spokenName.mockClear();
    rerender(<Harness pressedMidi={62} handlers={handlers} />);
    expect(renderedMidis()).toEqual([61, 62]); // nhả 61, nhấn 62
  });

  it('đối chứng: truyền hàm mới mỗi render thì memo mất tác dụng, cả ba phím render', () => {
    const fresh = () => ({ on: () => {}, off: () => {}, move: () => {} });
    const { rerender } = render(<Harness pressedMidi={null} handlers={fresh()} />);
    spokenName.mockClear();
    rerender(<Harness pressedMidi={61} handlers={fresh()} />);
    expect(renderedMidis()).toEqual([60, 61, 62]);
  });
});
