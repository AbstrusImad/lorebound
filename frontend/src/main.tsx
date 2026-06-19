import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { StoreProvider } from './state/store'
import { ToastProvider } from './components/shared/Toast'
import './styles.css'

// HashRouter keeps deep links working from the Cloudflare Pages root without
// server rewrites beyond the _redirects fallback.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StoreProvider>
      <ToastProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  </React.StrictMode>
)
