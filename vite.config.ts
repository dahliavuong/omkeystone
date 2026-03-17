import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'f4b8dd06735da997c35a-pod-msuofzdm6bdgfe6higfqunuefu-5173.us3p.cursorvm.com',
      '.cursorvm.com',
    ],
  },
})
