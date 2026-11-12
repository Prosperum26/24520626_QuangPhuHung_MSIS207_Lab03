import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SituationshipAnalyzer } from './SituationshipAnalyzer.jsx';

function send(actor, steps) {
  fireEvent.change(screen.getByLabelText(/ai nhắn/i), { target: { value: actor } });
  fireEvent.change(screen.getByLabelText(/số bước/i), { target: { value: String(steps) } });
  fireEvent.click(screen.getByRole('button', { name: /gửi tín hiệu/i }));
}

const click = (name) => fireEvent.click(screen.getByRole('button', { name }));
const status = () => screen.getByRole('status');

describe('SituationshipAnalyzer (B-03)', () => {
  it('bắt đầu ở FRIENDS, chưa có cờ đỏ', () => {
    render(<SituationshipAnalyzer />);
    expect(screen.getByText('Bạn bè')).toBeInTheDocument();
    expect(status()).toHaveTextContent(/chưa có dấu hiệu lạ/i);
    expect(status()).not.toHaveTextContent(/cờ đỏ/i);
  });

  it('cờ đỏ khi DATING_NO_LOVE và em < ai đó (100 x 0.1 = 10 < 1 x 50)', () => {
    render(<SituationshipAnalyzer />);
    click(/rủ đi chơi/i);
    send('EM', 100);
    send('AI_DO', 1);
    expect(status()).toHaveTextContent(/cờ đỏ/i);
    const scores = screen.getByRole('region', { name: /điểm nỗ lực/i });
    expect(within(scores).getByText('Em')).toBeInTheDocument();
    expect(scores).toHaveTextContent('10');
    expect(scores).toHaveTextContent('50');
  });

  it('không có cờ đỏ ở FRIENDS dù em < ai đó', () => {
    render(<SituationshipAnalyzer />);
    send('EM', 100);
    send('AI_DO', 1);
    expect(status()).not.toHaveTextContent(/cờ đỏ/i);
  });

  it('hết cờ đỏ khi em vượt ai đó', () => {
    render(<SituationshipAnalyzer />);
    click(/rủ đi chơi/i);
    send('AI_DO', 1);
    expect(status()).toHaveTextContent(/cờ đỏ/i);
    send('EM', 1000);
    expect(status()).not.toHaveTextContent(/cờ đỏ/i);
  });

  it('hai tín hiệu giống hệt vẫn là hai dòng nhật ký (key duy nhất)', () => {
    render(<SituationshipAnalyzer />);
    send('EM', 5);
    send('EM', 5);
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(2);
  });

  it('chỉ cho phép chuyển pha hợp lệ; GHOSTED_EXIT khoá form, Reset khôi phục', () => {
    render(<SituationshipAnalyzer />);
    expect(screen.getByRole('button', { name: /official/i })).toBeDisabled();
    click(/rủ đi chơi/i);
    click(/official/i);
    expect(screen.getByText('Yêu chính thức')).toBeInTheDocument();
    click(/dừng lại/i);
    expect(screen.getByText('Đã bị bỏ rơi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gửi tín hiệu/i })).toBeDisabled();
    click(/reset/i);
    expect(screen.getByText('Bạn bè')).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('số bước không hợp lệ (rỗng, 0, âm) thì không gửi được', () => {
    render(<SituationshipAnalyzer />);
    const steps = screen.getByLabelText(/số bước/i);
    const submit = screen.getByRole('button', { name: /gửi tín hiệu/i });
    for (const v of ['', '0', '-3']) {
      fireEvent.change(steps, { target: { value: v } });
      expect(submit).toBeDisabled();
    }
    fireEvent.change(steps, { target: { value: '7' } });
    expect(submit).toBeEnabled();
  });
});
