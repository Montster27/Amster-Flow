import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// Only use HTTPS in local development if certificates exist
const useHttps = fs.existsSync('./localhost+2-key.pem') && fs.existsSync('./localhost+2.pem')

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    https: useHttps ? {
      key: fs.readFileSync('./localhost+2-key.pem'),
      cert: fs.readFileSync('./localhost+2.pem'),
    } : undefined,
  },
})
