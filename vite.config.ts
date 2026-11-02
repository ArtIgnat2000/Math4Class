import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'illustrations/*.svg', 'icons/*.png', 'content/*.json'],
      manifest: {
        name: 'Число — математика с интересом',
        short_name: 'Число',
        description:
          'Короткие занятия по математике для 1–4 классов. В своём темпе, без страха ошибок.',
        lang: 'ru',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f7f8f4',
        theme_color: '#f7f8f4',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { host: '0.0.0.0', allowedHosts: true },
  preview: { host: '0.0.0.0', allowedHosts: true },
});
