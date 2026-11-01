import { Profiler, StrictMode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeveloperCard } from './DeveloperCard.jsx';
import { ScientistDirectory } from './ScientistDirectory.jsx';

// Đếm số lần React gọi DeveloperCard để chứng minh card không đổi thì không render lại.
vi.mock('./DeveloperCard.jsx', async (importOriginal) => {
  const actual = await importOriginal();
  return { DeveloperCard: vi.fn(actual.DeveloperCard) };
});

const searchBox = () => screen.getByLabelText('Tìm theo tên');
const minIqBox = () => screen.getByLabelText('IQ tối thiểu');
const sortBox = () => screen.getByLabelText('Sắp xếp');
const cardNames = () => screen.queryAllByRole('heading', { level: 2 }).map((h) => h.textContent);
const type = (value) => fireEvent.change(searchBox(), { target: { value } });

beforeEach(() => {
  DeveloperCard.mockClear();
});

describe('khung danh sách (E2-04)', () => {
  it('hiển thị đủ 7 người, mỗi người một article trong listitem', () => {
    render(<ScientistDirectory />);
    const list = screen.getByRole('list', { name: 'Danh sách nhà khoa học' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getAllByRole('article')).toHaveLength(7);
  });

  it('mặc định sắp xếp IQ giảm dần và minIq là 160', () => {
    render(<ScientistDirectory />);
    expect(minIqBox()).toHaveValue(160);
    expect(cardNames()[0]).toBe('Johann Goethe');
  });

  it('không có cảnh báo key hay lỗi nào dưới StrictMode, không <div> trong danh sách', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <StrictMode>
        <ScientistDirectory />
      </StrictMode>,
    );
    type('hung');
    fireEvent.change(sortBox(), { target: { value: 'age-asc' } });
    expect(spy).not.toHaveBeenCalled();
    expect(container.querySelectorAll('div')).toHaveLength(0);
    spy.mockRestore();
  });

  it('không ai dùng chung ảnh mặc định: mọi card chỉ hiện chữ cái đầu', () => {
    const { container } = render(<ScientistDirectory />);
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });
});

describe('ô tìm tên (E2-05)', () => {
  it('có label gắn đúng với input (useId)', () => {
    render(<ScientistDirectory />);
    expect(searchBox()).toHaveAttribute('type', 'search');
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it.each([
    ['ein', ['Albert Einstein']],
    ['  EIN ', ['Albert Einstein']],
    ['hung', ['Quảng Phú Hưng']],
    ['HƯNG', ['Quảng Phú Hưng']],
    ['phu quang', ['Quảng Phú Hưng']],
    ['vin', ['Leonardo da Vinci']],
  ])('gõ %j -> %j', (value, expected) => {
    render(<ScientistDirectory />);
    fireEvent.change(minIqBox(), { target: { value: '0' } });
    type(value);
    expect(cardNames()).toEqual(expected);
  });

  it('xóa query thì quay lại danh sách đầy đủ', () => {
    render(<ScientistDirectory />);
    type('ein');
    type('');
    expect(screen.getAllByRole('article')).toHaveLength(7);
  });

  it('submit form không tải lại trang', () => {
    render(<ScientistDirectory />);
    const form = screen.getByRole('search');
    const notPrevented = fireEvent.submit(form);
    expect(notPrevented).toBe(false);
  });
});

describe('ô IQ tối thiểu (E2-06)', () => {
  it('lọc theo số: 205 chỉ còn Goethe và Einstein', () => {
    render(<ScientistDirectory />);
    fireEvent.change(minIqBox(), { target: { value: '205' } });
    expect(cardNames()).toEqual(['Johann Goethe', 'Albert Einstein']);
  });

  it('xóa trắng không sinh NaN: về 0 và hiện đủ mọi người', () => {
    render(<ScientistDirectory />);
    fireEvent.change(minIqBox(), { target: { value: '' } });
    expect(minIqBox()).toHaveValue(0);
    expect(screen.getAllByRole('article')).toHaveLength(7);
  });

  it('minIq là số, không phải chuỗi (211 > 210 nên rỗng, không so sánh chuỗi)', () => {
    render(<ScientistDirectory />);
    fireEvent.change(minIqBox(), { target: { value: '211' } });
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    fireEvent.change(minIqBox(), { target: { value: '99' } });
    expect(screen.getAllByRole('article')).toHaveLength(7);
  });
});

describe('sắp xếp (E2-07)', () => {
  it('đổi sang tuổi tăng dần: người trẻ nhất lên đầu', () => {
    render(<ScientistDirectory />);
    fireEvent.change(sortBox(), { target: { value: 'age-asc' } });
    expect(cardNames()[0]).toBe('Quảng Phú Hưng');
  });

  it('đổi tiêu chí rồi đổi lại thì thứ tự cũ trở lại', () => {
    render(<ScientistDirectory />);
    const before = cardNames();
    fireEvent.change(sortBox(), { target: { value: 'age-asc' } });
    fireEvent.change(sortBox(), { target: { value: 'iq-desc' } });
    expect(cardNames()).toEqual(before);
  });

  it('sắp xếp không làm đổi thứ tự dữ liệu gốc truyền vào', () => {
    const data = Object.freeze([
      Object.freeze({ id: 'a', name: 'Zed', age: 30, iq: 170, searchKey: 'zed', metrics: Object.freeze({ age: 30, iq: 170 }) }),
      Object.freeze({ id: 'b', name: 'Amy', age: 20, iq: 190, searchKey: 'amy', metrics: Object.freeze({ age: 20, iq: 190 }) }),
    ]);
    render(<ScientistDirectory initialData={data} />);
    fireEvent.change(sortBox(), { target: { value: 'age-asc' } });
    expect(data.map((p) => p.id)).toEqual(['a', 'b']);
    expect(cardNames()).toEqual(['Amy', 'Zed']);
  });
});

describe('kiểm render (E2-08)', () => {
  const renderProfiled = (ui) => {
    const commits = [];
    const onRender = (_id, phase) => commits.push(phase);
    render(
      <Profiler id="directory" onRender={onRender}>
        {ui}
      </Profiler>,
    );
    return commits;
  };

  it('mỗi ký tự gõ vào ô tìm = đúng 1 commit (không render đôi)', () => {
    const commits = renderProfiled(<ScientistDirectory />);
    expect(commits).toEqual(['mount']);
    for (const value of ['h', 'hu', 'hun', 'hung']) type(value);
    expect(commits).toEqual(['mount', 'update', 'update', 'update', 'update']);
  });

  it('đổi IQ và đổi sắp xếp cũng mỗi thao tác đúng 1 commit', () => {
    const commits = renderProfiled(<ScientistDirectory />);
    fireEvent.change(minIqBox(), { target: { value: '190' } });
    fireEvent.change(sortBox(), { target: { value: 'age-asc' } });
    expect(commits).toHaveLength(3);
  });

  it('card còn lại không render lại khi bộ lọc đổi (memo + props ổn định)', () => {
    render(<ScientistDirectory />);
    DeveloperCard.mockClear();
    fireEvent.change(minIqBox(), { target: { value: '200' } });
    expect(cardNames()).toEqual(['Johann Goethe', 'Albert Einstein', 'William Sidis']);
    expect(DeveloperCard).not.toHaveBeenCalled();
  });

  it('đổi thứ tự sắp xếp không render lại card nào', () => {
    render(<ScientistDirectory />);
    DeveloperCard.mockClear();
    fireEvent.change(sortBox(), { target: { value: 'age-asc' } });
    expect(DeveloperCard).not.toHaveBeenCalled();
  });
});

describe('nút xoá (E2-09)', () => {
  const deleteBtn = (name) => screen.getByRole('button', { name: `Xoá ${name}` });

  it('mỗi người có một nút xoá, tên truy cập chứa tên người', () => {
    render(<ScientistDirectory />);
    expect(screen.getAllByRole('button', { name: /^Xoá / })).toHaveLength(7);
    expect(deleteBtn('Albert Einstein')).toBeInTheDocument();
  });

  it('xoá giữa danh sách: chỉ người đó mất, thứ tự và card còn lại giữ nguyên', () => {
    render(<ScientistDirectory />);
    fireEvent.change(minIqBox(), { target: { value: '0' } });
    const before = cardNames();
    DeveloperCard.mockClear();
    fireEvent.click(deleteBtn(before[3]));
    expect(cardNames()).toEqual(before.filter((_, i) => i !== 3));
    expect(DeveloperCard).not.toHaveBeenCalled();
  });

  it('không làm đổi mảng dữ liệu gốc', () => {
    const data = Object.freeze([
      Object.freeze({ id: 'a', name: 'Zed', age: 30, iq: 170, searchKey: 'zed', metrics: Object.freeze({ age: 30, iq: 170 }) }),
      Object.freeze({ id: 'b', name: 'Amy', age: 20, iq: 190, searchKey: 'amy', metrics: Object.freeze({ age: 20, iq: 190 }) }),
    ]);
    render(<ScientistDirectory initialData={data} />);
    fireEvent.click(deleteBtn('Zed'));
    expect(data).toHaveLength(2);
    expect(cardNames()).toEqual(['Amy']);
  });

  it('focus chuyển sang nút xoá của hàng kế, không rơi về body', () => {
    render(<ScientistDirectory />);
    const names = cardNames();
    deleteBtn(names[0]).focus();
    fireEvent.click(deleteBtn(names[0]));
    expect(deleteBtn(names[1])).toHaveFocus();
  });

  it('xoá hàng cuối thì focus lùi về hàng trước; hết hàng thì về ô tìm kiếm', () => {
    render(<ScientistDirectory />);
    fireEvent.change(minIqBox(), { target: { value: '205' } });
    deleteBtn('Albert Einstein').focus();
    fireEvent.click(deleteBtn('Albert Einstein'));
    expect(deleteBtn('Johann Goethe')).toHaveFocus();
    fireEvent.click(deleteBtn('Johann Goethe'));
    expect(searchBox()).toHaveFocus();
  });
});

describe('nút đặt lại (E2-10)', () => {
  it('khôi phục người đã xoá và cả ba điều khiển về mặc định', () => {
    render(<ScientistDirectory />);
    type('ein');
    fireEvent.change(minIqBox(), { target: { value: '10' } });
    fireEvent.change(sortBox(), { target: { value: 'age-asc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xoá Albert Einstein' }));
    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại' }));
    expect(searchBox()).toHaveValue('');
    expect(minIqBox()).toHaveValue(160);
    expect(sortBox()).toHaveValue('iq-desc');
    fireEvent.change(minIqBox(), { target: { value: '0' } });
    expect(screen.getAllByRole('article')).toHaveLength(7);
  });

  it('reset chỉ gây đúng 1 commit', () => {
    const commits = [];
    render(
      <Profiler id="d" onRender={(_id, phase) => commits.push(phase)}>
        <ScientistDirectory />
      </Profiler>,
    );
    type('ein');
    commits.length = 0;
    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại' }));
    expect(commits).toHaveLength(1);
  });
});

describe('trạng thái trực tiếp (E2-11)', () => {
  it('role=status, aria-live=polite, N khớp số card', () => {
    render(<ScientistDirectory />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Found 7 pioneers');
    expect(screen.getAllByRole('article')).toHaveLength(7);
  });

  it('N cập nhật theo bộ lọc và sau khi xoá', () => {
    render(<ScientistDirectory />);
    type('ein');
    expect(screen.getByRole('status')).toHaveTextContent('Found 1 pioneers');
    fireEvent.click(screen.getByRole('button', { name: 'Xoá Albert Einstein' }));
    expect(screen.getByRole('status')).toHaveTextContent('Không tìm thấy');
  });
});

describe('nâng state chọn người (thử thách C, E3-12)', () => {
  const selectBtn = (name) => screen.getByRole('button', { name: `Chi tiết ${name}` });

  it('không giữ state chọn riêng: selectedId do cha điều khiển, bấm gọi onSelect(id)', () => {
    const onSelect = vi.fn();
    render(<ScientistDirectory selectedId={null} onSelect={onSelect} />);
    fireEvent.click(selectBtn('Albert Einstein'));
    expect(onSelect).toHaveBeenCalledWith('sp-2');
    expect(selectBtn('Albert Einstein')).toHaveAttribute('aria-pressed', 'false');
  });

  it('hàng đang chọn có aria-pressed=true; bấm lại thì bỏ chọn (onSelect(null))', () => {
    const onSelect = vi.fn();
    render(<ScientistDirectory selectedId="sp-2" onSelect={onSelect} />);
    expect(selectBtn('Albert Einstein')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(selectBtn('Albert Einstein'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('xoá người đang chọn thì bỏ chọn; xoá người khác thì giữ nguyên', () => {
    const onSelect = vi.fn();
    render(<ScientistDirectory selectedId="sp-2" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Xoá Johann Goethe' }));
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Xoá Albert Einstein' }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('đổi lựa chọn không render lại card nào (nút chọn nằm ngoài card đã memo)', () => {
    const { rerender } = render(<ScientistDirectory selectedId={null} />);
    DeveloperCard.mockClear();
    rerender(<ScientistDirectory selectedId="sp-1" />);
    expect(DeveloperCard).not.toHaveBeenCalled();
  });
});
