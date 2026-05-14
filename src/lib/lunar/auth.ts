import { lunarConfig } from './config'
import { LunarTokenResponse } from './types'
import { saveLunarTokens, getLunarTokens } from './tokenStore'

export function getAuthorizationUrl(state: string) {
  const url = new URL(`${lunarConfig.authBaseUrl}/oauth2/authorize`)
  url.searchParams.append('response_type', 'code')
  url.searchParams.append('client_id', lunarConfig.clientId)
  url.searchParams.append('redirect_uri', lunarConfig.redirectUri)
  url.searchParams.append('scope', 'PSP_AI')
  url.searchParams.append('state', state)
  return url.toString()
}

export async function exchangeCodeForTokens(code: string, userId: string): Promise<LunarTokenResponse> {
  const response = await fetch(`${lunarConfig.authBaseUrl}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${lunarConfig.clientId}:${lunarConfig.clientSecret}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: lunarConfig.redirectUri
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code: ${error}`)
  }

  const tokens: LunarTokenResponse = await response.json()
  await saveLunarTokens(userId, tokens.access_token, tokens.refresh_token, tokens.expires_in)
  return tokens
}

export async function refreshAccessToken(userId: string): Promise<string> {
  const stored = await getLunarTokens(userId)
  if (!stored) throw new Error('No tokens found for user')

  // Only refresh if expired or close to expiring
  if (stored.expiresAt.getTime() > Date.now() + 60000) {
    return stored.accessToken
  }

  const response = await fetch(`${lunarConfig.authBaseUrl}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${lunarConfig.clientId}:${lunarConfig.clientSecret}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: stored.refreshToken
    })
  })

  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }

  const tokens: LunarTokenResponse = await response.json()
  await saveLunarTokens(userId, tokens.access_token, tokens.refresh_token, tokens.expires_in)
  return tokens.access_token
}
