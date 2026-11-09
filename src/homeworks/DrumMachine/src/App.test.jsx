import { render, screen } from '@testing-library/react';
import { it, expect, vi } from 'vitest';

vi.mock('./useDrumAudio.js', () => {
  const audio = {
    trigger: () => {},
    now: () => 0,
    getLevelDb: () => -60,
    error: null,
    kit: 'acoustic',
    setKit: () => {},
    volume: 0.8,
    setVolume: () => {},
    muted: false,
    setMuted: () => {},
  };
  return { useDrumAudio: () => audio };
});
const { App } = await import('./App.jsx');

it('render landmark main có tiêu đề h1 và vùng Pads', () => {
  render(<App />);
  expect(screen.getByRole('main')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1, name: 'Drum Kit' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Pads' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Mức âm' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Nhật ký gõ' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Âm thanh' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Looper' })).toBeInTheDocument();
});
