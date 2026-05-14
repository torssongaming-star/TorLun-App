import crypto from 'crypto'
import { lunarConfig } from './config'
import { createClient } from '@/lib/supabase/server'

const ALGORITHM = 'aes-256-cbc'

function encrypt(text: string): string {
  if (!lunarConfig.tokenEncryptionKey) return text
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(lunarConfig.tokenEncryptionKey, 'hex'), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decrypt(text: string): string {
  if (!lunarConfig.tokenEncryptionKey) return text
  const textParts = text.split(':')
  const iv = Buffer.from(textParts.shift()!, 'hex')
  const encryptedText = Buffer.from(textParts.join(':'), 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(lunarConfig.tokenEncryptionKey, 'hex'), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

export async function saveLunarTokens(userId: string, accessToken: string, refreshToken: string, expiresIn: number) {
  const supabase = await createClient()
  
  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)

  const { error } = await supabase
    .from('lunar_connections')
    .upsert({
      user_id: userId,
      provider: 'lunar',
      status: 'connected',
      access_token_encrypted: encrypt(accessToken),
      refresh_token_encrypted: encrypt(refreshToken),
      token_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, provider' })

  if (error) throw error
}

export async function getLunarTokens(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('lunar_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'lunar')
    .single()

  if (error || !data) return null

  return {
    accessToken: decrypt(data.access_token_encrypted),
    refreshToken: decrypt(data.refresh_token_encrypted),
    expiresAt: new Date(data.token_expires_at),
    status: data.status
  }
}
