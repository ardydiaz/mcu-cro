import { ConfidentialClientApplication, CryptoProvider } from '@azure/msal-node'
import { env, m365Configured } from '../config/env.js'

// User.Read: lets sign-in copy the person's Microsoft 365 profile photo (graphPhoto.js).
export const SCOPES = ['openid', 'profile', 'email', 'User.Read']

export const crypto = new CryptoProvider()

let client
export function getMsalClient() {
  if (!m365Configured) return null
  client ??= new ConfidentialClientApplication({
    auth: {
      clientId: env.m365.clientId,
      // Single-tenant authority: only accounts from the MCU tenant can sign in.
      authority: `https://login.microsoftonline.com/${env.m365.tenantId}`,
      clientSecret: env.m365.clientSecret,
    },
  })
  return client
}
