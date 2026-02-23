/// <reference types="vite/client" />

declare module 'virtual:pwa-register' {
  export function registerSW(options?: { immediate?: boolean }): () => Promise<void>
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_KIOSK_ID?: string
  readonly VITE_KIOSK_SECRET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
