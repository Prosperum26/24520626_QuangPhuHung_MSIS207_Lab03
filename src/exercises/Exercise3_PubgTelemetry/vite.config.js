import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { telemetryPlugin } from './server/telemetryPlugin.js';

export default defineConfig({
  plugins: [react(), telemetryPlugin()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
});
