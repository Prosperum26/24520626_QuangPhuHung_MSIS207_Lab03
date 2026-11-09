import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { App } from './App.jsx';

it('render landmark main có tiêu đề', () => {
  render(<App />);
  expect(screen.getByRole('main')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1, name: 'Drum Kit' })).toBeInTheDocument();
});
