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

  devtools: { enabled: false },
  css: ["./app/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  modules: ["@nuxt/icon"],
});
