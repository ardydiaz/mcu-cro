import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Providers from './app/providers.jsx'
import Router from './app/router.jsx'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Providers>
      <Router />
    </Providers>
  </StrictMode>,
)
