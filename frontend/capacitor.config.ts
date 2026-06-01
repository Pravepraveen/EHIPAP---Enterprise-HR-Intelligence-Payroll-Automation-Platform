import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig & { bundledWebRuntime?: false } = {
  appId: 'com.ehipap.app',
  appName: 'EHIPAP',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0f172a',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      showSpinner: true,
      spinnerColor: '#1976d2',
    },
    StatusBar: {
      style: 'LIGHT',
      overlaysWebView: false,
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
}

export default config
