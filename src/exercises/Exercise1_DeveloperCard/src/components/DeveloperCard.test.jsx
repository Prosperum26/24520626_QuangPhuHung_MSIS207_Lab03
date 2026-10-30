import { StrictMode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeveloperCard } from './DeveloperCard.jsx';
import { DEFAULT_FULL_NAME, DEFAULT_ROLE } from './developerCardModel.js';

const getAvatar = (container) => container.querySelector('img');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DeveloperCard khung (E1-03)', () => {
  it('là landmark article có tên lấy từ h2', () => {
    render(<DeveloperCard fullName="Ada Lovelace" role="Mathematician" />);
    const card = screen.getByRole('article', { name: 'Ada Lovelace' });
    expect(card).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(card).toHaveTextContent('Mathematician');
  });

  it('dùng default parameter khi không truyền props', () => {
    render(<DeveloperCard />);
    expect(screen.getByRole('article', { name: DEFAULT_FULL_NAME })).toHaveTextContent(DEFAULT_ROLE);
  });

  it('hai card cùng trang có aria-labelledby khác nhau, mỗi cái trỏ đúng heading', () => {
    render(
      <>
        <DeveloperCard fullName="Ada" />
        <DeveloperCard fullName="Grace" />
      </>,
    );
    const [first, second] = screen.getAllByRole('article');
    const idFirst = first.getAttribute('aria-labelledby');
    const idSecond = second.getAttribute('aria-labelledby');
    expect(idFirst).not.toBe(idSecond);
    expect(first.querySelector(`[id="${idFirst}"]`)).toHaveTextContent('Ada');
    expect(second.querySelector(`[id="${idSecond}"]`)).toHaveTextContent('Grace');
  });

  it('không có <div> nào bên trong card (kể cả khi đủ avatar, metrics, skills)', () => {
    const { container } = render(<DeveloperCard />);
    expect(container.querySelectorAll('div')).toHaveLength(0);
  });

  it('chuỗi HTML trong fullName hiện như text, không tạo element', () => {
    const evil = '<img src=x onerror=alert(1)>';
    const { container } = render(<DeveloperCard fullName={evil} avatarUrl="" />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(evil);
  });
});

describe('metrics dạng <dl> (E1-04)', () => {
  it('số dt = số dd = số khóa, nhãn và giá trị đã định dạng', () => {
    const { container } = render(<DeveloperCard metrics={{ vdomNodes: 5000, a11yScore: 100, someKey: 'n/a' }} />);
    const terms = container.querySelectorAll('dt');
    const defs = container.querySelectorAll('dd');
    expect(terms).toHaveLength(3);
    expect(defs).toHaveLength(3);
    expect([...terms].map((t) => t.textContent)).toEqual(['VDOM nodes', 'A11y score', 'Some key']);
    expect([...defs].map((d) => d.textContent)).toEqual(['5.000', '100', 'n/a']);
  });

  it('dt và dd nằm trực tiếp trong dl (không có wrapper)', () => {
    const { container } = render(<DeveloperCard metrics={{ commits: 1 }} />);
    const list = container.querySelector('dl');
    expect([...list.children].map((el) => el.tagName)).toEqual(['DT', 'DD']);
  });

  it('metrics rỗng thì không render dl', () => {
    const { container } = render(<DeveloperCard metrics={{}} />);
    expect(container.querySelector('dl')).toBeNull();
  });

  it('default metrics hiển thị đủ ba cặp', () => {
    const { container } = render(<DeveloperCard />);
    expect(container.querySelectorAll('dt')).toHaveLength(3);
  });
});

describe('danh sách kỹ năng (E1-05)', () => {
  const skills = [
    { id: 'a', name: 'React 19', tier: 'Core' },
    { id: 'b', name: 'Web Audio', tier: 'Awareness' },
  ];

  it('ul có tên truy cập và đủ listitem', () => {
    render(<DeveloperCard skills={skills} />);
    const list = screen.getByRole('list', { name: 'Engineered Skills' });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual(['React 19 (Core)', 'Web Audio (Awareness)']);
  });

  it('skills rỗng thì không render ul', () => {
    render(<DeveloperCard skills={[]} />);
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('không cảnh báo key hay lỗi nào dưới StrictMode', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <StrictMode>
        <DeveloperCard skills={skills} metrics={{ commits: 1, vdomNodes: 2 }} />
      </StrictMode>,
    );
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('avatar (E1-06)', () => {
  it('mặc định dùng ảnh local 64×64, alt rỗng, decode async, không lazy', () => {
    const { container } = render(<DeveloperCard />);
    const img = getAvatar(container);
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('width', '64');
    expect(img).toHaveAttribute('height', '64');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img).not.toHaveAttribute('loading');
    expect(img.getAttribute('src')).toMatch(/avatar-128/);
  });

  it('nhận URL https', () => {
    const { container } = render(<DeveloperCard avatarUrl="https://example.com/a.png" />);
    expect(getAvatar(container)).toHaveAttribute('src', 'https://example.com/a.png');
  });

  it.each([
    ['chuỗi rỗng', ''],
    ['null', null],
    ['http://', 'http://example.com/a.png'],
    ['javascript:', 'javascript:alert(1)'],
    ['data:', 'data:image/png;base64,AAAA'],
  ])('%s thì không có <img>, hiện chữ cái đầu', (_label, url) => {
    const { container } = render(<DeveloperCard fullName="Quang Phú Hưng" avatarUrl={url} />);
    expect(getAvatar(container)).toBeNull();
    const initials = screen.getByText('QH');
    expect(initials).toHaveAttribute('aria-hidden', 'true');
  });

  it('ảnh lỗi thì chuyển sang chữ cái đầu', () => {
    const { container } = render(<DeveloperCard fullName="Ada Lovelace" avatarUrl="https://example.com/broken.png" />);
    fireEvent.error(getAvatar(container));
    expect(getAvatar(container)).toBeNull();
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('tự hồi khi avatarUrl đổi; URL đã lỗi vẫn ở fallback', () => {
    const bad = 'https://example.com/broken.png';
    const good = 'https://example.com/ok.png';
    const { container, rerender } = render(<DeveloperCard fullName="Ada Lovelace" avatarUrl={bad} />);

    fireEvent.error(getAvatar(container));
    expect(getAvatar(container)).toBeNull();

    rerender(<DeveloperCard fullName="Ada Lovelace" avatarUrl={good} />);
    expect(getAvatar(container)).toHaveAttribute('src', good);

    rerender(<DeveloperCard fullName="Ada Lovelace" avatarUrl={bad} />);
    expect(getAvatar(container)).toBeNull();
  });

  it('lỗi ảnh của card này không ảnh hưởng card khác', () => {
    const { container } = render(
      <>
        <DeveloperCard fullName="Ada Lovelace" avatarUrl="https://example.com/1.png" />
        <DeveloperCard fullName="Grace Hopper" avatarUrl="https://example.com/2.png" />
      </>,
    );
    const [first] = container.querySelectorAll('img');
    fireEvent.error(first);
    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.queryByText('GH')).toBeNull();
  });
});
