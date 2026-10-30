import { memo, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeveloperCard } from './DeveloperCard.jsx';
import { SkillBadge } from './SkillBadge.jsx';

// Đếm số lần React gọi SkillBadge: mỗi lần DeveloperCard render lại, SkillBadge cũng bị gọi lại.
vi.mock('./SkillBadge.jsx', async (importOriginal) => {
  const actual = await importOriginal();
  return { SkillBadge: vi.fn(actual.SkillBadge) };
});

const MemoCard = memo(DeveloperCard);

function Harness({ Card }) {
  const [clicks, setClicks] = useState(0);
  return (
    <>
      <button type="button" onClick={() => setClicks((c) => c + 1)}>
        parent {clicks}
      </button>
      <Card />
    </>
  );
}

describe('props mặc định ổn định (D2) và quyết định memo (D10)', () => {
  beforeEach(() => {
    SkillBadge.mockClear();
  });

  it('không bọc memo: cha đổi state không liên quan thì card render lại (hành vi mặc định của React)', () => {
    render(<Harness Card={DeveloperCard} />);
    const before = SkillBadge.mock.calls.length;
    fireEvent.click(screen.getByRole('button'));
    expect(SkillBadge.mock.calls.length).toBeGreaterThan(before);
  });

  it('nếu bọc memo: cha đổi state thì card KHÔNG render lại vì default là hằng ổn định', () => {
    render(<Harness Card={MemoCard} />);
    const before = SkillBadge.mock.calls.length;
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));
    expect(SkillBadge.mock.calls.length).toBe(before);
  });
});
