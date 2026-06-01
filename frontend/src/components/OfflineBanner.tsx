import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'

const OFFLINE_STATUS_EVENT = 'ehipap:offline-status'

const OfflineBanner: React.FC = () => {
  const [browserOffline, setBrowserOffline] = useState(() => !window.navigator.onLine)
  const [apiOffline, setApiOffline] = useState(false)

  useEffect(() => {
    const syncBrowserStatus = () => {
      setBrowserOffline(!window.navigator.onLine)
    }

    const syncApiStatus = (event: Event) => {
      const detail = (event as CustomEvent<{ offline?: boolean }>).detail
      setApiOffline(Boolean(detail?.offline))
    }

    window.addEventListener('online', syncBrowserStatus)
    window.addEventListener('offline', syncBrowserStatus)
    window.addEventListener(OFFLINE_STATUS_EVENT, syncApiStatus as EventListener)

    return () => {
      window.removeEventListener('online', syncBrowserStatus)
      window.removeEventListener('offline', syncBrowserStatus)
      window.removeEventListener(OFFLINE_STATUS_EVENT, syncApiStatus as EventListener)
    }
  }, [])

  if (!browserOffline && !apiOffline) return null

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10001,
        px: 2,
        py: 1,
        pt: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        bgcolor: '#92400e',
        color: 'white',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.18)',
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        ⚠️ Offline Mode: Running locally from device memory.
      </Typography>
    </Box>
  )
}

export default OfflineBanner
