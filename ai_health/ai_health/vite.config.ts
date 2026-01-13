import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api/fastgpt': {
        target: 'https://cloud.fastgpt.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fastgpt/, ''),
      },
      '/api/asr': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/asr/, ''),
      },
      '/api/tts': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tts/, ''),
      },
    },
  },
  preview: {
    allowedHosts: true,
  },
})
