import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// The schema and examples live in the repo root, outside this frontend/ dir.
// Studio imports them directly (single source of truth — never a copy), so the
// dev server must be allowed to read one level up.
export default defineConfig({
  plugins: [vue()],
  server: { fs: { allow: ['..'] } },
  test: { environment: 'node' },
})
