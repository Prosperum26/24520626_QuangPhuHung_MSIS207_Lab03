import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App.jsx';

describe('App (smoke, B-00)', () => {
  it('render landmark main và heading', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /situationship analyzer/i })).toBeInTheDocument();
  });
});
