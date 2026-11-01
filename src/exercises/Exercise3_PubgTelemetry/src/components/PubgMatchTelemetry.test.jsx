import { StrictMode } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchKraftonPubgTelemetry } from '../api/krafton.js';
import { SQUADS_BY_ID } from '../data/pubgSquads.js';
import { PubgMatchTelemetry } from './PubgMatchTelemetry.jsx';

vi.mock('../api/krafton.js', () => ({ fetchKraftonPubgTelemetry: vi.fn() }));

// Mỗi lần gọi fetch tạo một request treo, test tự quyết lúc nào resolve/reject.
let requests;
const abortError = () => new DOMException('aborted', 'AbortError');

const useControlledFetch = ({ honourSignal = true } = {}) => {
  requests = [];
  fetchKraftonPubgTelemetry.mockImplementation((squadId, { signal }) =>
    new Promise((resolve, reject) => {
      requests.push({ squadId, signal, resolve: () => resolve(SQUADS_BY_ID.get(squadId)), reject });
      if (honourSignal) signal.addEventListener('abort', () => reject(abortError()), { once: true });
    }),
  );
};

const flush = (fn) => act(async () => fn());
const pick = (name) => fireEvent.click(screen.getByRole('button', { name }));
const heading = () => screen.queryByRole('heading', { level: 2 });
const last = () => requests.at(-1);

beforeEach(() => {
  vi.clearAllMocks();
  useControlledFetch();
});

describe('bốn trạng thái (E3-03)', () => {
  it('mount: gọi fetch cho squad mặc định "te" và hiện skeleton aria-busy', () => {
    render(<PubgMatchTelemetry />);
    expect(fetchKraftonPubgTelemetry).toHaveBeenCalledWith('te', { signal: expect.any(AbortSignal) });
    expect(screen.getByLabelText('Đang tải telemetry')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Đang đồng bộ');
  });

  it('SUCCESS: hiện article đúng squad, bỏ skeleton', async () => {
    render(<PubgMatchTelemetry />);
    await flush(() => last().resolve());
    expect(screen.getByRole('article', { name: 'The Expendables' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Đang tải telemetry')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Radar cập nhật lúc \d/);
  });

  it('ERROR: hiện role=alert với thông điệp và nút Retry, không dùng window.alert', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<PubgMatchTelemetry />);
    await flush(() => last().reject(new Error('Satellite packet timeout')));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Satellite packet timeout');
    expect(within(alert).getByRole('button', { name: 'Reconnect Satellite (Retry)' })).toHaveAttribute('type', 'button');
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('prop squadId chọn squad ban đầu', () => {
    render(<PubgMatchTelemetry squadId="ge" />);
    expect(fetchKraftonPubgTelemetry).toHaveBeenCalledWith('ge', expect.anything());
    expect(screen.getByRole('button', { name: 'Genius Esports' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('không cảnh báo hay lỗi nào dưới StrictMode', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <StrictMode>
        <PubgMatchTelemetry />
      </StrictMode>,
    );
    await flush(() => last().resolve());
    expect(heading()).toHaveTextContent('The Expendables');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('huỷ request khi đổi squad (E3-04)', () => {
  it('StrictMode: effect chạy hai lần nhưng request đầu bị huỷ, chỉ request cuối được dùng', async () => {
    render(
      <StrictMode>
        <PubgMatchTelemetry />
      </StrictMode>,
    );
    expect(requests).toHaveLength(2);
    expect(requests[0].signal.aborted).toBe(true);
    expect(requests[1].signal.aborted).toBe(false);
    await flush(() => requests[1].resolve());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('đổi squad khi đang tải: huỷ request cũ, không hiện lỗi giả, dữ liệu đúng squad mới', async () => {
    render(<PubgMatchTelemetry />);
    const first = last();
    await flush(() => pick('Cerberus Esports'));
    expect(first.signal.aborted).toBe(true);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await flush(() => last().resolve());
    expect(heading()).toHaveTextContent('Cerberus Esports');
  });

  it('kết quả muộn của request đã huỷ không ghi đè (kể cả khi fetch phớt lờ signal)', async () => {
    useControlledFetch({ honourSignal: false });
    render(<PubgMatchTelemetry />);
    const stale = last();
    await flush(() => pick('Genius Esports'));
    await flush(() => last().resolve());
    await flush(() => stale.resolve());
    expect(heading()).toHaveTextContent('Genius Esports');
  });

  it('lỗi muộn của request đã huỷ cũng không hiện banner', async () => {
    useControlledFetch({ honourSignal: false });
    render(<PubgMatchTelemetry />);
    const stale = last();
    await flush(() => pick('Genius Esports'));
    await flush(() => stale.reject(new Error('late failure')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('unmount huỷ request đang bay', () => {
    const { unmount } = render(<PubgMatchTelemetry />);
    const pending = last();
    unmount();
    expect(pending.signal.aborted).toBe(true);
  });

  it('lỗi thật (không phải AbortError) vẫn hiện banner', async () => {
    render(<PubgMatchTelemetry />);
    await flush(() => last().reject(new Error('boom')));
    expect(screen.getByRole('alert')).toHaveTextContent('boom');
  });
});

describe('bộ chọn squad và cache (E3-05)', () => {
  it('ba nút CES, TE, GE; chỉ nút đang chọn có aria-pressed=true', () => {
    render(<PubgMatchTelemetry />);
    const pressed = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') === 'true')
      .map((b) => b.textContent);
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(2);
    expect(pressed).toEqual(['The Expendables']);
    expect(screen.getByRole('group', { name: 'Chọn squad' })).toBeInTheDocument();
  });

  it('bấm nhanh CES -> TE -> GE: hai request đầu bị huỷ, UI cuối khớp GE', async () => {
    render(<PubgMatchTelemetry />);
    await flush(() => pick('Cerberus Esports'));
    await flush(() => pick('The Expendables'));
    await flush(() => pick('Genius Esports'));
    expect(requests.map((r) => r.squadId)).toEqual(['te', 'ces', 'te', 'ge']);
    expect(requests.slice(0, 3).every((r) => r.signal.aborted)).toBe(true);
    await flush(() => last().resolve());
    expect(heading()).toHaveTextContent('Genius Esports');
    expect(screen.getByRole('button', { name: 'Genius Esports' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('quay lại squad đã tải: hiện ngay dữ liệu cũ, không skeleton, không gọi fetch lại', async () => {
    render(<PubgMatchTelemetry />);
    await flush(() => last().resolve());
    await flush(() => pick('Cerberus Esports'));
    await flush(() => last().resolve());
    const calls = fetchKraftonPubgTelemetry.mock.calls.length;
    await flush(() => pick('The Expendables'));
    expect(heading()).toHaveTextContent('The Expendables');
    expect(screen.queryByLabelText('Đang tải telemetry')).not.toBeInTheDocument();
    expect(fetchKraftonPubgTelemetry).toHaveBeenCalledTimes(calls);
  });

  it('lần tải đầu của mỗi squad vẫn hiện skeleton', async () => {
    render(<PubgMatchTelemetry />);
    await flush(() => last().resolve());
    await flush(() => pick('Genius Esports'));
    expect(screen.getByLabelText('Đang tải telemetry')).toBeInTheDocument();
  });

  it('lỗi không được cache: chọn lại squad lỗi thì tải lại', async () => {
    render(<PubgMatchTelemetry />);
    await flush(() => last().reject(new Error('lost')));
    await flush(() => pick('Cerberus Esports'));
    await flush(() => last().resolve());
    await flush(() => pick('The Expendables'));
    expect(requests.filter((r) => r.squadId === 'te')).toHaveLength(2);
  });
});

describe('hiển thị SUCCESS (E3-06)', () => {
  it('article có h2 tên squad và dl đủ 6 cặp dt/dd', async () => {
    render(<PubgMatchTelemetry />);
    await flush(() => last().resolve());
    const article = screen.getByRole('article', { name: 'The Expendables' });
    const terms = within(article).getAllByRole('term').map((t) => t.textContent);
    const values = within(article).getAllByRole('definition').map((d) => d.textContent);
    expect(terms).toEqual(['Map', 'Phase', 'Alive', 'Kills', 'WWCD', 'Status']);
    expect(values).toEqual(['Miramar', 'Phase 7', '4', '18', '82%', 'Holding High Ground']);
  });

  it('vùng thông báo là một <output aria-live=polite> luôn có mặt, không bị thay mới theo trạng thái', async () => {
    render(<PubgMatchTelemetry />);
    const region = screen.getByRole('status');
    expect(region.tagName).toBe('OUTPUT');
    expect(region).toHaveAttribute('aria-live', 'polite');
    await flush(() => last().resolve());
    expect(screen.getByRole('status')).toBe(region);
  });

  it('không có <div> trong radar', async () => {
    const { container } = render(<PubgMatchTelemetry />);
    await flush(() => last().resolve());
    expect(container.querySelectorAll('div')).toHaveLength(0);
  });
});

describe('nút Retry (E3-08)', () => {
  const retry = () => screen.getByRole('button', { name: 'Reconnect Satellite (Retry)' });

  it('bấm Retry: về LOADING (skeleton), gọi fetch lại đúng squad rồi hiện kết quả mới', async () => {
    render(<PubgMatchTelemetry />);
    await flush(() => last().reject(new Error('Satellite packet timeout')));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await flush(() => fireEvent.click(retry()));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Đang tải telemetry')).toBeInTheDocument();
    expect(requests.map((r) => r.squadId)).toEqual(['te', 'te']);

    await flush(() => last().resolve());
    expect(heading()).toHaveTextContent('The Expendables');
  });

  it('Retry lỗi tiếp thì hiện lại banner, thử lần nữa vẫn được', async () => {
    render(<PubgMatchTelemetry />);
    await flush(() => last().reject(new Error('lost 1')));
    await flush(() => fireEvent.click(retry()));
    await flush(() => last().reject(new Error('lost 2')));
    expect(screen.getByRole('alert')).toHaveTextContent('lost 2');
    await flush(() => fireEvent.click(retry()));
    await flush(() => last().resolve());
    expect(requests).toHaveLength(3);
    expect(heading()).toBeInTheDocument();
  });

  it('bấm Retry rồi đổi squad ngay: request retry bị huỷ, không hiện lỗi giả', async () => {
    render(<PubgMatchTelemetry />);
    await flush(() => last().reject(new Error('lost')));
    await flush(() => fireEvent.click(retry()));
    const retried = last();
    await flush(() => pick('Genius Esports'));
    expect(retried.signal.aborted).toBe(true);
    await flush(() => last().resolve());
    expect(heading()).toHaveTextContent('Genius Esports');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('polling và Pause Radar (E3-11)', () => {
  const POLL = 5000;
  const status = () => screen.getByRole('status');
  const pauseBtn = () => screen.getByRole('button', { name: /^(Pause|Resume) Radar$/ });
  const tick = (ms) => act(async () => vi.advanceTimersByTimeAsync(ms));
  const settle = async () => {
    render(<PubgMatchTelemetry />);
    await act(async () => last().resolve());
  };

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('đủ 5 giây thì poll đúng 1 lần, giữ nguyên card (không quay lại skeleton)', async () => {
    await settle();
    expect(requests).toHaveLength(1);
    await tick(POLL - 1);
    expect(requests).toHaveLength(1);
    await tick(1);
    expect(requests).toHaveLength(2);
    expect(requests[1].squadId).toBe('te');
    expect(screen.queryByLabelText('Đang tải telemetry')).not.toBeInTheDocument();
    expect(heading()).toHaveTextContent('The Expendables');
    await act(async () => last().resolve());
    expect(heading()).toHaveTextContent('The Expendables');
  });

  it('Pause: không poll nữa; Resume: poll lại sau 5 giây', async () => {
    await settle();
    fireEvent.click(pauseBtn());
    expect(pauseBtn()).toHaveTextContent('Resume Radar');
    await tick(POLL * 3);
    expect(requests).toHaveLength(1);
    fireEvent.click(pauseBtn());
    expect(pauseBtn()).toHaveTextContent('Pause Radar');
    await tick(POLL);
    expect(requests).toHaveLength(2);
  });

  it('mỗi render không tạo interval mới: đúng 1 setInterval cho squad này', async () => {
    const spy = vi.spyOn(globalThis, 'setInterval');
    await settle();
    fireEvent.click(pauseBtn());
    fireEvent.click(pauseBtn());
    // mount (1) + sau pause/resume (1) = 2, không tăng theo số lần render
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it('unmount: dừng interval và huỷ poll đang bay, không còn timer treo', async () => {
    const { unmount } = render(<PubgMatchTelemetry />);
    await act(async () => last().resolve());
    await tick(POLL);
    const inflight = last();
    unmount();
    expect(inflight.signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('đổi squad khi poll đang bay: huỷ poll cũ, kết quả muộn không ghi đè', async () => {
    useControlledFetch({ honourSignal: false });
    await settle();
    await tick(POLL);
    const stalePoll = last();
    await act(async () => pick('Genius Esports'));
    expect(stalePoll.signal.aborted).toBe(true);
    await act(async () => last().resolve());
    await act(async () => stalePoll.resolve());
    expect(heading()).toHaveTextContent('Genius Esports');
  });

  it('poll lỗi: giữ dữ liệu cũ, báo tín hiệu yếu, không hiện banner lỗi', async () => {
    await settle();
    await tick(POLL);
    await act(async () => last().reject(new Error('lost')));
    expect(heading()).toHaveTextContent('The Expendables');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(status()).toHaveTextContent('Tín hiệu yếu');
    await tick(POLL);
    await act(async () => last().resolve());
    expect(status()).toHaveTextContent(/Radar cập nhật lúc/);
  });

  it('tab ẩn: bỏ qua nhịp poll; tab hiện lại thì poll tiếp', async () => {
    await settle();
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    await tick(POLL * 2);
    expect(requests).toHaveLength(1);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    await tick(POLL);
    expect(requests).toHaveLength(2);
  });

  it('request poll trước chưa xong thì không chồng thêm request mới', async () => {
    await settle();
    await tick(POLL);
    await tick(POLL * 2);
    expect(requests).toHaveLength(2);
  });

  it('StrictMode: không rò interval sau khi unmount', async () => {
    const { unmount } = render(
      <StrictMode>
        <PubgMatchTelemetry />
      </StrictMode>,
    );
    await act(async () => requests.at(-1).resolve());
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
