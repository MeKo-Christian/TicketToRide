import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// VITE_BASE is set in CI to '/TicketToRide/' for GitHub Pages.
// Locally it defaults to '/' so dev/preview work without env vars.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
