import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const fastgptKey = env.VITE_FASTGPT_API_KEY
  const dashscopeKey = env.VITE_DASHSCOPE_API_KEY

  return {
    plugins: [react()],
    server: {
      host: true,
      allowedHosts: true,
      proxy: {
        '/api/fastgpt': {
          target: 'https://cloud.fastgpt.cn',
          changeOrigin: true,
          headers: fastgptKey ? { Authorization: `Bearer ${fastgptKey}` } : undefined,
          rewrite: (path) => path.replace(/^\/api\/fastgpt/, ''),
        },
        '/api/asr': {
          target: 'https://dashscope.aliyuncs.com',
          changeOrigin: true,
          headers: dashscopeKey ? { Authorization: `Bearer ${dashscopeKey}` } : undefined,
          rewrite: (path) => path.replace(/^\/api\/asr/, ''),
        },
        '/api/tts': {
          target: 'https://dashscope.aliyuncs.com',
          changeOrigin: true,
          headers: dashscopeKey ? { Authorization: `Bearer ${dashscopeKey}` } : undefined,
          rewrite: (path) => path.replace(/^\/api\/tts/, ''),
        },
      },
    },
    preview: {
      allowedHosts: true,
    },
  }
})
