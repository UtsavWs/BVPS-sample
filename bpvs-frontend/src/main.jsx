import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { MemberProvider } from './context/MemberContext.jsx'
import { ConfirmProvider } from './context/ConfirmProvider.jsx'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <MemberProvider>
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    </MemberProvider>
  </AuthProvider>
)
