import tailwindcss from "@tailwindcss/vite";
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

  app: {
    head: {
      link: [
        { rel: 'manifest', href: '/manifest.json' }
      ]
    }
  },

  modules: ["@nuxt/icon", "@nuxtjs/i18n"],
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
