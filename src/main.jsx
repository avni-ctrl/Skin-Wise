import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root'), {
  onUncaughtError: (error, info) => {
    window.__uncaught = { message: String(error?.message || error), stack: String(error?.stack || '').slice(0, 1500), componentStack: String(info?.componentStack || '').slice(0, 800) }
    console.error('UNCAUGHT RENDER ERROR', error)
  },
}).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)
