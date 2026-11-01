import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App.jsx';

const detail = () => screen.getByRole('complementary', { name: 'Chi tiết đang chọn' });
const select = (name) => fireEvent.click(screen.getByRole('button', { name: `Chi tiết ${name}` }));

describe('thử thách C: bấm hàng ở danh sách đổi thẻ chi tiết (E3-12)', () => {
  it('ban đầu chưa chọn: có chữ hướng dẫn, chưa có thẻ chi tiết', () => {
    render(<App />);
    expect(within(detail()).queryByRole('article')).not.toBeInTheDocument();
    expect(within(detail()).getByText(/Bấm/)).toBeInTheDocument();
  });

  it('chọn một người thì thẻ chi tiết hiện đúng người đó, chọn người khác thì đổi theo', () => {
    render(<App />);
    select('Albert Einstein');
    expect(within(detail()).getByRole('heading', { level: 2 })).toHaveTextContent('Albert Einstein');
    expect(within(detail()).getByText('205')).toBeInTheDocument();
    select('Quảng Phú Hưng');
    expect(within(detail()).getByRole('heading', { level: 2 })).toHaveTextContent('Quảng Phú Hưng');
  });

  it('bấm lại người đang chọn thì bỏ chọn', () => {
    render(<App />);
    select('Isaac Newton');
    select('Isaac Newton');
    expect(within(detail()).queryByRole('article')).not.toBeInTheDocument();
  });

  it('xoá người đang chọn thì thẻ chi tiết biến mất', () => {
    render(<App />);
    select('Albert Einstein');
    fireEvent.click(screen.getByRole('button', { name: 'Xoá Albert Einstein' }));
    expect(within(detail()).queryByRole('article')).not.toBeInTheDocument();
  });

  it('Đặt lại bỏ chọn', () => {
    render(<App />);
    select('Isaac Newton');
    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại' }));
    expect(within(detail()).queryByRole('article')).not.toBeInTheDocument();
  });

  it('thẻ chi tiết chỉ xuất hiện ở vùng aside, danh sách vẫn đủ 7 người', () => {
    render(<App />);
    select('Albert Einstein');
    expect(screen.getAllByRole('article')).toHaveLength(8);
    expect(within(screen.getByRole('list', { name: 'Danh sách nhà khoa học' })).getAllByRole('article')).toHaveLength(7);
  });
});
