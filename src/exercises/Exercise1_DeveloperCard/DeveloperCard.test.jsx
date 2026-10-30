import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DeveloperCard } from './DeveloperCard.jsx';
import { DEFAULT_FULL_NAME, DEFAULT_ROLE } from './developerCardModel.js';

describe('DeveloperCard khung', () => {
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

  it('không có <div> nào bên trong card', () => {
    const { container } = render(<DeveloperCard />);
    expect(container.querySelectorAll('div')).toHaveLength(0);
  });

  it('chuỗi HTML trong fullName hiện như text, không tạo element', () => {
    const evil = '<img src=x onerror=alert(1)>';
    const { container } = render(<DeveloperCard fullName={evil} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(evil);
  });
});
