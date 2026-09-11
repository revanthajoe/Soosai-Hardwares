import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // Vite derives isProduction from process.env.NODE_ENV, so a stray
  // NODE_ENV=development in the build environment (Vercel's project settings,
  // for one) silently resolves React's development export condition and ships
  // a ~304KB dev build with jsxDEV instead of the ~178KB production one.
  // Pin it for builds only; `vite dev` is left alone.
  if (command === 'build') {
    process.env.NODE_ENV = 'production';
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          // Order matters: these are substring tests, so the most specific
          // package names must be checked first. Testing 'node_modules/react'
          // before 'node_modules/react-router-dom' would swallow the router
          // (and react-dom) into vendor-react and the router chunk would never
          // be emitted at all.
          manualChunks: (id) => {
            if (id.includes('node_modules/react-router')) {
              return 'vendor-router';
            }
            if (id.includes('node_modules/framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
              return 'vendor-charts';
            }
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'vendor-react';
            }
          },
        },
      },
      cssCodeSplit: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 500,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
    },
  };
})
