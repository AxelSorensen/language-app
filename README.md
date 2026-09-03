# 🗣️ Language App

A writing-practice app for learning a new language by journaling in it, with AI grammar correction along the way.

![Language App screenshot](docs/screenshot.png)

## Features

- ✍️ **Journal mode** — write freely in your target language toward a daily word-count goal, tracked with a progress bar
- ✅ **Grammar checking** — sentences are sent to OpenAI for correction, returning a corrected version alongside your original
- 📖 **Vocabulary tracking** — words you use get logged and charted over time (`useVocabulary`, `VocabularyChart`)
- ⌨️ **Custom on-screen keyboard** — a `CustomKeyboard`/`KeyboardKey` component for typing characters and diacritics not on a standard layout
- 🌍 **Multi-language support** — language switching (`LanguageSelector`) with locale files for English and Spanish, and support for formal Arabic (MSA)
- 🔥 **Firebase-backed data** — entries and vocabulary persist via `FirestoreRepository`, with OpenAI calls routed through `OpenAIRepository`

## Installation

```bash
git clone <this repo>
cd language-app
npm install
```

Requires Firebase project credentials and an OpenAI API key (see `firebase.json` / server config).

## Configuration

Copy `.env.example` to `.env` and fill in:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Server-side OpenAI key used for grammar checking. Without it, `OpenAIRepository` returns mock responses instead of calling the real API. |

Firebase config (`plugins/firebase.client.ts`) is currently hardcoded in the repo rather than read from environment variables — swap in your own Firebase project's config there if you need a different backend.

## Usage

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). To run against local Firebase emulators instead:

```bash
npm run emulate
```

## Built with

- [Nuxt 4](https://nuxt.com/)
- [Firebase](https://firebase.google.com/) (Firestore)
- [OpenAI API](https://platform.openai.com/)
- [Chart.js](https://www.chartjs.org/) via `vue-chartjs`
- [@nuxtjs/i18n](https://i18n.nuxtjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Status

🚧 Actively developed personal project — core journaling, grammar-check, and vocabulary-tracking loop works; language coverage is still being expanded (recently reworked to target formal Arabic).

✅ `pnpm install && pnpm run dev` verified working as of 2026-09-03 (dev server serves on localhost:3000). Note: repo ships a `pnpm-lock.yaml`, so use `pnpm` rather than `npm`. Requires your own Firebase project credentials and an OpenAI API key for full functionality (not verified beyond server boot).
