import { LunarConfig } from './types'

export const lunarConfig: LunarConfig = {
  mode: (process.env.LUNAR_MODE as any) || 'mock',
  clientId: process.env.LUNAR_CLIENT_ID || '',
  clientSecret: process.env.LUNAR_CLIENT_SECRET || '',
  redirectUri: process.env.LUNAR_REDIRECT_URI || '',
  authBaseUrl: process.env.LUNAR_AUTH_BASE_URL || 'https://auth.openbanking.lunar.app',
  apiBaseUrl: process.env.LUNAR_API_BASE_URL || 'https://api.openbanking.lunar.app',
  certPath: process.env.LUNAR_CERT_PATH,
  keyPath: process.env.LUNAR_KEY_PATH,
  tokenEncryptionKey: process.env.LUNAR_TOKEN_ENCRYPTION_KEY || ''
}

export function isLunarConfigured(): boolean {
  if (lunarConfig.mode === 'mock') return true
  
  return !!(
    lunarConfig.clientId && 
    lunarConfig.clientSecret && 
    lunarConfig.redirectUri && 
    lunarConfig.tokenEncryptionKey
  )
}
