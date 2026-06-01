import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { ThemeProvider, CssBaseline } from '@mui/material'
import App from './App'
import { store } from './app/store'
import { theme } from './themes/theme'
import { initCapacitor } from './capacitor-init'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
import { installRuntimeErrorOverlay } from './runtime-error-overlay'
import './styles/global.css'

installRuntimeErrorOverlay()
void initCapacitor()

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <Router>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <OfflineBanner />
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ThemeProvider>
      </Router>
    </Provider>
  </React.StrictMode>
)
