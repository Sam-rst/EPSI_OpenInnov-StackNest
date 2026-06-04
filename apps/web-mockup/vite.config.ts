import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const r = (p: string) => path.resolve(__dirname, p);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@core', replacement: r('./src/core') },
      { find: '@marketing', replacement: r('./src/marketing') },
      { find: '@auth', replacement: r('./src/auth') },
      { find: '@catalog', replacement: r('./src/catalog') },
      { find: '@deployment', replacement: r('./src/deployment') },
      { find: '@dashboard', replacement: r('./src/dashboard') },
      { find: '@chat', replacement: r('./src/chat') },
      { find: '@admin', replacement: r('./src/admin') },
      { find: '@settings', replacement: r('./src/settings') },
      { find: '@', replacement: r('./src') },
    ],
  },
  server: { port: 5173, host: true },
  build: { outDir: 'dist', sourcemap: true },
});
