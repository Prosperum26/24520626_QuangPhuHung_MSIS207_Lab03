import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { GrandPiano } from './GrandPiano.jsx';
import { spokenName } from '../music/notes.js';
import { createFakeAudio } from '../audio/fakeAudio.js';

// Đếm số lần PianoKey render: mỗi lần render gọi spokenName đúng một lần (cho aria-label).
vi.mock('../music/notes.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, spokenName: vi.fn(original.spokenName) };
});

let audio;
beforeEach(() => {
  audio = createFakeAudio();
  vi.stubGlobal('AudioContext', function FakeAudioContext() {
    return audio.ctx;
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const keyButton = (midi) => document.querySelector(`[data-midi="${midi}"]`);

describe('GrandPiano: cấu trúc', () => {
  it('render đủ 88 nút phím trong 9 nhóm quãng tám có tên', () => {
    render(<GrandPiano />);
    const piano = screen.getByRole('region', { name: 'Bàn phím 88 phím' });
    expect(within(piano).getAllByRole('button')).toHaveLength(88);
    expect(within(piano).getAllByRole('group')).toHaveLength(9);
    expect(screen.getByRole('group', { name: 'Quãng tám 4' })).toBeInTheDocument();
  });

  it('52 phím trắng + 36 phím đen (đếm qua data-pc, không hardcode)', () => {
    render(<GrandPiano />);
    const blackPcs = new Set(['1', '3', '6', '8', '10']);
    const buttons = screen.getAllByRole('button');
    expect(buttons.filter((b) => !blackPcs.has(b.dataset.pc))).toHaveLength(52);
    expect(buttons.filter((b) => blackPcs.has(b.dataset.pc))).toHaveLength(36);
  });

  it('mỗi phím có tên riêng: A0, C thăng 4, C8', () => {
    render(<GrandPiano />);
    expect(screen.getByRole('button', { name: 'A0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'C thăng 4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'C8' })).toBeInTheDocument();
  });
});

describe('GrandPiano: roving tabindex (D8)', () => {
  it('chỉ một phím nằm trong thứ tự Tab, mặc định là C4', () => {
    render(<GrandPiano />);
    const tabbable = screen.getAllByRole('button').filter((b) => b.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAccessibleName('C4');
  });

  it('ArrowRight chuyển focus và điểm dừng Tab sang phím kế (C thăng 4)', () => {
    render(<GrandPiano />);
    keyButton(60).focus();
    fireEvent.keyDown(keyButton(60), { code: 'ArrowRight' });
    expect(keyButton(61)).toHaveFocus();
    expect(keyButton(61).tabIndex).toBe(0);
    expect(keyButton(60).tabIndex).toBe(-1);
  });

  it('ArrowLeft lùi, Home về A0, End tới C8; không vượt biên', () => {
    render(<GrandPiano />);
    fireEvent.keyDown(keyButton(60), { code: 'ArrowLeft' });
    expect(keyButton(59)).toHaveFocus();
    fireEvent.keyDown(keyButton(59), { code: 'Home' });
    expect(keyButton(21)).toHaveFocus();
    fireEvent.keyDown(keyButton(21), { code: 'ArrowLeft' });
    expect(keyButton(21)).toHaveFocus();
    fireEvent.keyDown(keyButton(21), { code: 'End' });
    expect(keyButton(108)).toHaveFocus();
    fireEvent.keyDown(keyButton(108), { code: 'ArrowRight' });
    expect(keyButton(108)).toHaveFocus();
  });
});

describe('GrandPiano: nhấn phím', () => {
  it('pointerdown sáng phím (aria-pressed) và phát đúng tần số; pointerup tắt', () => {
    render(<GrandPiano />);
    fireEvent.pointerDown(keyButton(69), { button: 0 });
    expect(keyButton(69)).toHaveAttribute('aria-pressed', 'true');
    expect(audio.calls).toContainEqual(['freq', 0, 440, 0]);
    fireEvent.pointerUp(keyButton(69));
    expect(keyButton(69)).toHaveAttribute('aria-pressed', 'false');
  });

  it('Space giữ/nhả cũng sáng/tắt phím', () => {
    render(<GrandPiano />);
    fireEvent.keyDown(keyButton(60), { code: 'Space' });
    expect(keyButton(60)).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyUp(keyButton(60), { code: 'Space' });
    expect(keyButton(60)).toHaveAttribute('aria-pressed', 'false');
  });

  it('nhấn 9 phím: phím đầu hết sáng (voice bị cướp), 8 phím sau vẫn sáng', () => {
    render(<GrandPiano />);
    for (let midi = 60; midi < 69; midi += 1) fireEvent.pointerDown(keyButton(midi), { button: 0 });
    expect(keyButton(60)).toHaveAttribute('aria-pressed', 'false');
    for (let midi = 61; midi < 69; midi += 1) expect(keyButton(midi)).toHaveAttribute('aria-pressed', 'true');
  });

  it('cửa sổ mất focus thì mọi phím tắt', () => {
    render(<GrandPiano />);
    fireEvent.pointerDown(keyButton(60), { button: 0 });
    fireEvent.pointerDown(keyButton(64), { button: 0 });
    fireEvent(window, new Event('blur'));
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0);
  });
});

describe('GrandPiano: cô lập render (cổng H2-07, bản tự động)', () => {
  it('lúc mount cả 88 phím render; nhấn một phím thì chỉ đúng phím đó render lại', () => {
    render(<GrandPiano />);
    expect(spokenName).toHaveBeenCalledTimes(88);
    spokenName.mockClear();

    fireEvent.pointerDown(keyButton(64), { button: 0 });
    expect(spokenName).toHaveBeenCalledTimes(1);
    expect(spokenName).toHaveBeenCalledWith(64);

    spokenName.mockClear();
    fireEvent.pointerUp(keyButton(64));
    expect(spokenName).toHaveBeenCalledTimes(1);
  });

  it('nhấn thêm phím thứ hai: chỉ phím thứ hai render, phím đang giữ không render lại', () => {
    render(<GrandPiano />);
    fireEvent.pointerDown(keyButton(60), { button: 0 });
    spokenName.mockClear();
    fireEvent.pointerDown(keyButton(64), { button: 0 });
    expect(spokenName.mock.calls.map((c) => c[0])).toEqual([64]);
  });

  it('nốt thứ 9 làm đúng 2 phím render: phím mới sáng, phím bị cướp tắt', () => {
    render(<GrandPiano />);
    for (let midi = 60; midi < 68; midi += 1) fireEvent.pointerDown(keyButton(midi), { button: 0 });
    spokenName.mockClear();
    fireEvent.pointerDown(keyButton(68), { button: 0 });
    expect(spokenName.mock.calls.map((c) => c[0]).toSorted()).toEqual([60, 68]);
  });

  it('di chuyển focus bằng mũi tên chỉ làm 2 phím render (cũ và mới)', () => {
    render(<GrandPiano />);
    spokenName.mockClear();
    fireEvent.keyDown(keyButton(60), { code: 'ArrowRight' });
    expect(spokenName.mock.calls.map((c) => c[0]).toSorted()).toEqual([60, 61]);
  });
});
