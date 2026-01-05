import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  imports: {
    autoImport: true,
  },

  runtimeConfig: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY, // private
    public: {
      // If you want it available client-side (not recommended for secrets)
      // OPENAI_API_KEY: process.env.OPENAI_API_KEY
    },
  },

  devServer: {
    host: "0.0.0.0",
  },

  ssr: false,

  devtools: { enabled: false },
  css: ["./app/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "My Nuxt App",
      short_name: "NuxtApp",
      theme_color: "#0f172a",
      background_color: "#ffffff",
      display: "standalone",
      start_url: "/",
      icons: [
        {
          src: "/icon.svg",
          sizes: "192x192",
          type: "image/svg+xml",
        },
        {
          src: "/icon.svg",
          sizes: "512x512",
          type: "image/svg+xml",
        },
      ],
    },
  },

  modules: ["@nuxt/icon", "@nuxtjs/i18n", "@vite-pwa/nuxt"],
  i18n: {
    locales: [
      { code: "en", name: "English", file: "en.json" },
      { code: "es", name: "Spanish", file: "es.json" },
    ],
    defaultLocale: "en",
    strategy: "prefix", // 👈 important
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
    },
  },
});
