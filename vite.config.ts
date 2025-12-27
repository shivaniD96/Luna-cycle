import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env file from project root
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Specifically define the required environment variables for the app
        'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
        'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''),
        // Shim the process.env object to prevent crashes in libraries that check it
        'process.env': JSON.stringify({
          API_KEY: env.API_KEY || process.env.API_KEY || '',
          GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
        })
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html'),
          },
        },
      }
    };
});