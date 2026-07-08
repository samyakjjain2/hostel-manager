import React from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { AppRouter } from './router/AppRouter'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#FFFFFF',
              color: '#0F172A',
              border: '1px solid #E2E8F0',
              fontSize: '12px'
            }
          }} 
        />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
