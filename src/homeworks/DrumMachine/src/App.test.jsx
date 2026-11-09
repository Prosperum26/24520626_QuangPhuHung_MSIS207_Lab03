import { render, screen } from '@testing-library/react';
import { it, expect, vi } from 'vitest';

vi.mock('./useDrumAudio.js', () => ({ useDrumAudio: () => ({ trigger: vi.fn(), error: null }) }));
const { App } = await import('./App.jsx');

it('render landmark main có tiêu đề h1 và vùng Pads', () => {
  render(<App />);
  expect(screen.getByRole('main')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1, name: 'Drum Kit' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Pads' })).toBeInTheDocument();
});
