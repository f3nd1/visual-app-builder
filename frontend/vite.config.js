import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// The schema and examples live in the repo root, outside this frontend/ dir.
// Studio imports them directly (single source of truth — never a copy), so the
// dev server must be allowed to read one level up.
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  server: { fs: { allow: ['..'] } },
  build: {
    rollupOptions: {
      input: {
        // Studio and Runtime are separate bundles (ARCHITECTURE.md).
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        runtime: fileURLToPath(new URL('./runtime.html', import.meta.url)),
      },
    },
  },
  // Vitest owns test/ (unit); Playwright owns e2e/ (.spec.js). Scope vitest so
  // it does not try to run the Playwright specs (its default glob matches .spec.js too).
  test: { environment: 'node', include: ['test/**/*.test.js'] },
})
