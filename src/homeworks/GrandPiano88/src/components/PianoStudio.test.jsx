import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { PianoStudio } from './PianoStudio.jsx';
import { createFakeAudio } from '../audio/fakeAudio.js';

let audio;
beforeEach(() => {
  vi.useFakeTimers();
  audio = createFakeAudio();
  vi.stubGlobal('AudioContext', function FakeAudioContext() {
    return audio.ctx;
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const advance = (ms) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
const key = (midi) => document.querySelector(`[data-midi="${midi}"]`);
const button = (name) => screen.getByRole('button', { name });
const status = () => screen.getByRole('status');
const pressedKeys = () => document.querySelectorAll('[data-midi][aria-pressed="true"]');
const stopCalls = () => audio.calls.filter((c) => c[0] === 'osc.stop').length;

/** Ghi nốt: nhấn `midi`, giữ `holdMs`, nhả. */
async function playNote(midi, holdMs) {
  fireEvent.pointerDown(key(midi), { button: 0 });
  await advance(holdMs);
  fireEvent.pointerUp(key(midi));
}

/** Ghi sẵn: 60 (giữ 100 ms) rồi 64 cách 200 ms (giữ 100 ms). */
async function recordTwoNotes() {
  fireEvent.click(button('Ghi'));
  await playNote(60, 100);
  await advance(100);
  await playNote(64, 100);
  fireEvent.click(button('Ghi'));
}

describe('PianoStudio: trạng thái ban đầu', () => {
  it('chưa ghi thì Phát và Dừng bị vô hiệu; vùng status có sẵn', () => {
    render(<PianoStudio />);
    expect(button('Phát')).toBeDisabled();
    expect(button('Dừng')).toBeDisabled();
    expect(button('Ghi')).toHaveAttribute('aria-pressed', 'false');
    expect(status()).toHaveTextContent('Bấm Ghi');
  });
});

describe('PianoStudio: ghi (H2-10)', () => {
  it('Ghi bật aria-pressed và báo "Đang ghi"; Ghi lần nữa dừng và báo số nốt', async () => {
    render(<PianoStudio />);
    fireEvent.click(button('Ghi'));
    expect(button('Ghi')).toHaveAttribute('aria-pressed', 'true');
    expect(status()).toHaveTextContent('Đang ghi');
    expect(button('Phát')).toBeDisabled();

    await playNote(60, 100);
    fireEvent.click(button('Ghi'));
    expect(button('Ghi')).toHaveAttribute('aria-pressed', 'false');
    expect(status()).toHaveTextContent('Đã ghi 1 nốt');
    expect(button('Phát')).toBeEnabled();
  });

  it('không ghi gì thì báo "Chưa ghi nốt nào" và Phát vẫn vô hiệu', () => {
    render(<PianoStudio />);
    fireEvent.click(button('Ghi'));
    fireEvent.click(button('Ghi'));
    expect(status()).toHaveTextContent('Chưa ghi nốt nào');
    expect(button('Phát')).toBeDisabled();
  });

  it('chơi khi không ghi thì không thành bản ghi', async () => {
    render(<PianoStudio />);
    await playNote(60, 100);
    fireEvent.click(button('Ghi'));
    fireEvent.click(button('Ghi'));
    expect(status()).toHaveTextContent('Chưa ghi nốt nào');
  });

  it('hợp âm nhấn trước nhả sau vẫn đủ 2 nốt', async () => {
    render(<PianoStudio />);
    fireEvent.click(button('Ghi'));
    fireEvent.pointerDown(key(60), { button: 0 });
    await advance(10);
    fireEvent.pointerDown(key(64), { button: 0 });
    await advance(50);
    fireEvent.pointerUp(key(60));
    fireEvent.pointerUp(key(64));
    fireEvent.click(button('Ghi'));
    expect(status()).toHaveTextContent('Đã ghi 2 nốt');
  });

  it('cửa sổ mất focus khi đang giữ phím thì phím tắt và nốt vẫn được ghi (không treo)', async () => {
    render(<PianoStudio />);
    fireEvent.click(button('Ghi'));
    fireEvent.pointerDown(key(60), { button: 0 });
    await advance(100);
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(pressedKeys()).toHaveLength(0);
    fireEvent.click(button('Ghi'));
    expect(status()).toHaveTextContent('Đã ghi 1 nốt');
  });
});

describe('PianoStudio: voice bị cướp lúc đang ghi', () => {
  // Lưu ý: kết quả nghe/thấy khi phát lại giống nhau dù bộ ghi có đóng nốt bị cướp hay không (lúc phát lại,
  // nốt thứ 9 lại cướp đúng nốt đó ở cùng thời điểm). Việc đóng nốt chỉ đổi durationMs trong dữ liệu; phần đó
  // được phủ bởi test usePiano (gọi onSteal) và test recorder (noteOff đóng nốt). Test này kiểm tra hành vi nhìn thấy.
  it('ghi 9 nốt giữ cùng lúc rồi phát lại: nốt đầu tắt, tám nốt sau sáng', async () => {
    render(<PianoStudio />);
    fireEvent.click(button('Ghi'));
    fireEvent.pointerDown(key(60), { button: 0 });
    await advance(100);
    for (let midi = 61; midi <= 68; midi += 1) fireEvent.pointerDown(key(midi), { button: 0 }); // 68 là nốt thứ 9: cướp 60
    await advance(500);
    for (let midi = 61; midi <= 68; midi += 1) fireEvent.pointerUp(key(midi));
    fireEvent.click(button('Ghi'));
    expect(status()).toHaveTextContent('Đã ghi 9 nốt');

    fireEvent.click(button('Phát'));
    await advance(150); // nốt 60 bị cướp ở 100 ms nên đã nhả; nếu bị kéo dài tới 600 ms thì còn sáng
    expect(key(60)).toHaveAttribute('aria-pressed', 'false');
    expect(key(61)).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button('Dừng'));
    await advance(0);
  });
});

describe('PianoStudio: phát lại (H2-10)', () => {
  it('phát: phím sáng đúng lúc, tắt đúng lúc, xong thì báo "Phát xong"', async () => {
    render(<PianoStudio />);
    await recordTwoNotes();
    fireEvent.click(button('Phát'));
    await advance(0);
    expect(status()).toHaveTextContent('Đang phát 2 nốt ở tốc độ 1x');
    expect(key(60)).toHaveAttribute('aria-pressed', 'true');
    expect(key(64)).toHaveAttribute('aria-pressed', 'false');

    await advance(150); // 150 ms: nốt 60 đã nhả (100 ms), nốt 64 chưa tới (200 ms)
    expect(key(60)).toHaveAttribute('aria-pressed', 'false');
    await advance(100); // 250 ms: nốt 64 đang giữ
    expect(key(64)).toHaveAttribute('aria-pressed', 'true');
    await advance(100);
    expect(pressedKeys()).toHaveLength(0);
    expect(status()).toHaveTextContent('Phát xong.');
    expect(button('Phát')).toBeEnabled();
  });

  it('phát lại hai lần liên tiếp đều giống nhau (phát không tự ghi lại)', async () => {
    render(<PianoStudio />);
    await recordTwoNotes();
    for (let i = 0; i < 2; i += 1) {
      fireEvent.click(button('Phát'));
      await advance(0);
      expect(status()).toHaveTextContent('Đang phát 2 nốt');
      await advance(400);
      expect(status()).toHaveTextContent('Phát xong.');
    }
  });

  it('đang phát thì Ghi và Phát vô hiệu, Dừng và các nút tốc độ thì: Dừng bật, tốc độ vô hiệu', async () => {
    render(<PianoStudio />);
    await recordTwoNotes();
    fireEvent.click(button('Phát'));
    await advance(0);
    expect(button('Ghi')).toBeDisabled();
    expect(button('Phát')).toBeDisabled();
    expect(button('Dừng')).toBeEnabled();
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
  });

  it('Dừng khi đang phát: im ngay, phím tắt hết, báo "Đã dừng", nốt sau không phát', async () => {
    render(<PianoStudio />);
    await recordTwoNotes();
    fireEvent.click(button('Phát'));
    await advance(50); // nốt 60 đang giữ
    expect(key(60)).toHaveAttribute('aria-pressed', 'true');
    const stopsBefore = stopCalls();

    fireEvent.click(button('Dừng'));
    await advance(0);
    expect(pressedKeys()).toHaveLength(0);
    expect(status()).toHaveTextContent('Đã dừng.');
    expect(stopCalls()).toBe(stopsBefore + 1); // oscillator của nốt 60 được tắt

    const oscillatorsBefore = audio.oscillators.length;
    await advance(1000);
    expect(audio.oscillators.length).toBe(oscillatorsBefore); // nốt 64 không bao giờ phát
    expect(key(64)).toHaveAttribute('aria-pressed', 'false');
  });

  it('tốc độ 2x: phát xong trong nửa thời gian', async () => {
    render(<PianoStudio />);
    await recordTwoNotes(); // dài 300 ms ở 1x
    fireEvent.click(screen.getByRole('radio', { name: '2x' }));
    fireEvent.click(button('Phát'));
    await advance(0);
    expect(status()).toHaveTextContent('tốc độ 2x');
    await advance(160); // 300/2 = 150 ms
    expect(status()).toHaveTextContent('Phát xong.');
  });

  it('tốc độ 0,5x: sau 400 ms vẫn đang phát (cần 600 ms)', async () => {
    render(<PianoStudio />);
    await recordTwoNotes();
    fireEvent.click(screen.getByRole('radio', { name: '0,5x' }));
    fireEvent.click(button('Phát'));
    await advance(400);
    expect(status()).toHaveTextContent('Đang phát');
    await advance(250);
    expect(status()).toHaveTextContent('Phát xong.');
  });

  it('người chơi chơi chồng lên lúc phát lại được (cùng synth)', async () => {
    render(<PianoStudio />);
    await recordTwoNotes();
    fireEvent.click(button('Phát'));
    await advance(10);
    fireEvent.pointerDown(key(70), { button: 0 });
    expect(key(70)).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button('Dừng'));
    await advance(0);
    expect(key(70)).toHaveAttribute('aria-pressed', 'true'); // Dừng chỉ tắt nốt của lần phát, không tắt nốt người chơi
    fireEvent.pointerUp(key(70));
  });

  it('unmount khi đang phát: huỷ, không còn timer, không lỗi cập nhật state', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<PianoStudio />);
    await recordTwoNotes();
    fireEvent.click(button('Phát'));
    await advance(50);
    expect(vi.getTimerCount()).toBeGreaterThan(0); // đang chờ nốt kế tiếp
    unmount();
    expect(vi.getTimerCount()).toBe(0); // huỷ ngay lúc unmount, không đợi chạy hết
    await advance(1000);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
