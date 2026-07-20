import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Keep environment access at the application boundary so execution utilities
// remain testable outside Vite (Jest/Node do not support import.meta.env).
// @ts-ignore Vite injects ImportMeta.env at build time.
globalThis.__ALGOVISION_EXECUTION_API_URL__ = import.meta.env.VITE_EXECUTION_API_URL || ''

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
