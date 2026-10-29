import './styles/global.css' // first, so component styles can override it
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Providers from './app/providers.jsx'
import Router from './app/router.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Providers>
      <Router />
    </Providers>
  </StrictMode>,
)
