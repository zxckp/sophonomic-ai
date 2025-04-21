// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';

export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: false, // Disable TypeScript checking
      eslint: {
        lintCommand: 'eslint "./src/**/*.{js,jsx}"',
      },
    }),
  ],
});