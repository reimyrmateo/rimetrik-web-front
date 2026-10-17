declare global {
  interface ImportMetaEnv {
    readonly VITE_APP_NAME?: string
  }
}

export const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'RIMETRIK',
  apiBasePath: '/api',
  isProduction: import.meta.env.PROD,
} as const
