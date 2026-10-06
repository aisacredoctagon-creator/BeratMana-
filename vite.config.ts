import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// GitHub Pages (project page) melayani situs di https://<user>.github.io/<repo>/, jadi base harus '/<repo>/'.
// Semua path aset di kode memakai import.meta.env.BASE_URL (bukan path tetap). Untuk hosting di root domain
// (Netlify/Vercel/lokal) jalankan dengan BASE_PATH=/ , mis. `BASE_PATH=/ npm run build`.
const REPO = 'BeratMana-';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: env.BASE_PATH || `/${REPO}/`,
    build: { target: 'es2022', sourcemap: false },
    test: { environment: 'node', include: ['src/**/*.test.ts'] },
  };
});
