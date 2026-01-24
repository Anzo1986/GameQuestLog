import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/GameQuestLog/', // Base path for GitHub Pages
  build: {
    outDir: 'dist',
  }
})
