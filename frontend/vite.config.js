import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Content Security Policy for the built site: only our own scripts, styles,
// images and API, plus Google Fonts. Added at build time only, because the Vite
// dev server needs inline scripts for hot reload. Directives that only work as
// an HTTP header (frame-ancestors) must also be set by the production web server.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const contentSecurityPolicy = () => ({
  name: 'content-security-policy',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  server: {
    port: 2001,
    strictPort: true,
    proxy: { '/api': 'http://localhost:2002' },
  },
})
