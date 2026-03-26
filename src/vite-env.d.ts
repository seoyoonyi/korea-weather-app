/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KMA_SERVICE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
