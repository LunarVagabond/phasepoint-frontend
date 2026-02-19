/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_KIOSK_ID?: string
  readonly VITE_KIOSK_SECRET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
