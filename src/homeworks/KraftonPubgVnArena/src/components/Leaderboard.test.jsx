import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { SQUADS } from '../domain/arenaConfig.js';
import { Leaderboard } from './Leaderboard.jsx';
import leaderboardSource from './Leaderboard.jsx?raw';

/** Tên đội theo thứ tự hàng trong tbody. */
const squadOrder = () =>
  within(screen.getAllByRole('rowgroup')[1])
    .queryAllByRole('row')
    .map((row) => within(row).getAllByRole('rowheader')[0].textContent);

describe('Leaderboard', () => {
  it('mặc định sắp xếp WWCD giảm dần; input/select có label', () => {
    render(<Leaderboard squads={SQUADS} />);
    expect(squadOrder()).toEqual(['The Expendables', 'Cerberus Esports', 'AGG', 'Roy Esports']);
    expect(screen.getByLabelText('Lọc theo tên đội')).toBeInTheDocument();
    expect(screen.getByLabelText('Sắp xếp theo')).toBeInTheDocument();
  });

  it('lọc không phân biệt hoa thường', () => {
    render(<Leaderboard squads={SQUADS} />);
    fireEvent.change(screen.getByLabelText('Lọc theo tên đội'), { target: { value: 'ESPORTS' } });
    expect(squadOrder()).toEqual(['Cerberus Esports', 'Roy Esports']);
    expect(screen.getByText('Hiển thị 2/4 đội')).toBeInTheDocument();
  });

  it('không có đội khớp thì báo bằng chữ', () => {
    render(<Leaderboard squads={SQUADS} />);
    fireEvent.change(screen.getByLabelText('Lọc theo tên đội'), { target: { value: 'zzz' } });
    expect(screen.getByText('Không có đội nào khớp.')).toBeInTheDocument();
    expect(squadOrder()).toEqual([]);
  });

  it.each([
    ['placementPts', ['The Expendables', 'Cerberus Esports', 'AGG', 'Roy Esports']],
    ['killPts', ['Cerberus Esports', 'The Expendables', 'AGG', 'Roy Esports']],
  ])('sắp xếp theo %s giảm dần và đánh dấu aria-sort', (key, expected) => {
    render(<Leaderboard squads={SQUADS} />);
    fireEvent.change(screen.getByLabelText('Sắp xếp theo'), { target: { value: key } });
    expect(squadOrder()).toEqual(expected);
    expect(screen.getAllByRole('columnheader').filter((th) => th.getAttribute('aria-sort') === 'descending')).toHaveLength(1);
  });

  it('cùng điểm thì xếp theo tên (ổn định)', () => {
    const tied = [
      { squadId: 'b', squadName: 'B Team', wwcdCount: 1, placementPts: 1, killPts: 1 },
      { squadId: 'a', squadName: 'A Team', wwcdCount: 1, placementPts: 1, killPts: 1 },
    ];
    render(<Leaderboard squads={tied} />);
    expect(squadOrder()).toEqual(['A Team', 'B Team']);
  });

  it('sắp xếp bất biến: không đổi mảng gốc', () => {
    const original = SQUADS.map((s) => s.squadId);
    const frozen = Object.freeze([...SQUADS]);
    render(<Leaderboard squads={frozen} />);
    fireEvent.change(screen.getByLabelText('Sắp xếp theo'), { target: { value: 'killPts' } });
    expect(frozen.map((s) => s.squadId)).toEqual(original);
  });

  it('cột số hạng tăng dần theo thứ tự hiển thị, key theo squadId', () => {
    render(<Leaderboard squads={SQUADS} />);
    const ranks = within(screen.getAllByRole('rowgroup')[1])
      .queryAllByRole('row')
      .map((row) => within(row).getAllByRole('cell')[0].textContent);
    expect(ranks).toEqual(['1', '2', '3', '4']);
  });

  it('lọc/sắp xếp là dẫn xuất: file không dùng useEffect', () => {
    expect(leaderboardSource).not.toMatch(/useEffect/);
  });
});
