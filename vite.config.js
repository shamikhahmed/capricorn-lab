import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: Number(process.env.PORT) || 4321,
    open: true,
  },
});
