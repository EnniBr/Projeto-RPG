import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { SessaoProvider } from './contexts/SessaoContext'
import { SocketProvider } from './contexts/SocketContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SessaoProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </SessaoProvider>
    </BrowserRouter>
  </StrictMode>
)