function stringifyReason(reason: unknown): string {
  if (reason instanceof Error) {
    return [
      `Message: ${reason.message}`,
      '',
      `Stack: ${reason.stack || 'No stack available'}`,
    ].join('\n')
  }

  if (typeof reason === 'string') return reason

  try {
    return JSON.stringify(reason, null, 2)
  } catch {
    return String(reason)
  }
}

function showRuntimeError(title: string, details: string) {
  const existing = document.getElementById('runtime-error-overlay')
  if (existing) existing.remove()

  const overlay = document.createElement('div')
  overlay.id = 'runtime-error-overlay'
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:2147483647',
    'padding:16px',
    'padding-top:calc(env(safe-area-inset-top, 0px) + 16px)',
    'background:#fff5f5',
    'color:#991b1b',
    'font-family:monospace',
    'overflow:auto',
    'white-space:pre-wrap',
  ].join(';')

  const heading = document.createElement('h1')
  heading.textContent = title
  heading.style.cssText = 'font-size:20px;margin:0 0 12px 0;color:#991b1b'

  const pre = document.createElement('pre')
  pre.textContent = details
  pre.style.cssText = [
    'margin:0',
    'padding:12px',
    'border:1px solid #fecaca',
    'border-radius:8px',
    'background:#fee2e2',
    'color:#991b1b',
    'overflow:auto',
  ].join(';')

  overlay.appendChild(heading)
  overlay.appendChild(pre)
  document.body.appendChild(overlay)
}

export function installRuntimeErrorOverlay() {
  window.addEventListener('error', (event) => {
    showRuntimeError('JavaScript Runtime Crash', [
      `Message: ${event.message}`,
      `Source: ${event.filename}:${event.lineno}:${event.colno}`,
      '',
      stringifyReason(event.error),
    ].join('\n'))
  })

  window.addEventListener('unhandledrejection', (event) => {
    showRuntimeError('Unhandled Promise Rejection', stringifyReason(event.reason))
  })
}
