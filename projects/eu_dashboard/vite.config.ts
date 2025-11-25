import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Debug: log what we're loading
    console.log('=== Vite Build Environment ===');
    console.log('Mode:', mode);
    console.log('GEMINI_API_KEY from env:', env.GEMINI_API_KEY ? '***SET***' : 'NOT SET');
    console.log('VITE_GEMINI_API_KEY from env:', env.VITE_GEMINI_API_KEY ? '***SET***' : 'NOT SET');
    console.log('================================');

    // Use VITE_ prefixed variable or GEMINI_API_KEY
    const apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      optimizeDeps: {
        exclude: ['@duckdb/duckdb-wasm'],
        esbuildOptions: {
          target: 'esnext',
        },
      },
      worker: {
        format: 'es',
      },
    };
});
