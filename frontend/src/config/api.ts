import { Capacitor } from '@capacitor/core'

/**
 * Resolve API base URL for web vs native Android.
 * - Web dev: empty string → Vite/nginx proxy at /api
 * - Android production fallback: current PC LAN backend for physical phone testing
 * - Override anytime via VITE_API_BASE_URL at build time
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl !== undefined && envUrl !== '') {
    return envUrl.replace(/\/$/, '')
  }

  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    return 'http://10.92.250.53:8880'
  }

  return ''
}
