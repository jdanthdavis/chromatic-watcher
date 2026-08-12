/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Base URL of the deployed watcher API (server/api.js), e.g.
  // "https://chromatic-watcher-api.onrender.com". Leave unset in dev — the
  // Vite dev server proxies /api to a local instance instead (vite.config.ts).
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
