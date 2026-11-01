import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { PresenceProvider } from './context/PresenceContext'
import { SiteProvider } from './context/SiteContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <SiteProvider>
                <PresenceProvider>
                  <App />
                </PresenceProvider>
              </SiteProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>,
)
