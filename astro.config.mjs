// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@src': '/src',
      }
    }
  },
  adapter: node({
    mode: 'standalone'
  }),
  i18n: {
    locales: ["en", "fr"], // Locales you want to support
    defaultLocale: "en", // Default locale (fallback)
    routing: {
      prefixDefaultLocale: false, // Ensures that your default locale is prefixed aswell
    },
  },
  
});