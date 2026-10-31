import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkillBadge } from './SkillBadge.jsx';

describe('SkillBadge', () => {
  it('hiển thị tên và tier bằng chữ trong một listitem', () => {
    render(
      <ul>
        <SkillBadge name="React 19 Fiber" tier="Core" />
      </ul>,
    );
    expect(screen.getByRole('listitem')).toHaveTextContent('React 19 Fiber (Core)');
  });

  it('tier mặc định là Core', () => {
    render(
      <ul>
        <SkillBadge name="Vite" />
      </ul>,
    );
    expect(screen.getByRole('listitem')).toHaveTextContent('Vite (Core)');
  });
});
