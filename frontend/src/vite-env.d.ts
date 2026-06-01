/// <reference types="vite/client" />

import 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** When true, a 401 will not clear session or redirect to login (caller handles errors) */
    skipAuthRedirect?: boolean
    skipAuthRefresh?: boolean
  }
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
