import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App.jsx';

describe('App', () => {
  it('render landmark main, tiêu đề và danh sách crate', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('PVS Arena');
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });
});
