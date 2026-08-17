import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CssBaseline from '@mui/material/CssBaseline'
import './index.css'
import { App } from './app/App'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found: expected an element with id="root" in index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <CssBaseline />
    <App />
  </StrictMode>,
)
