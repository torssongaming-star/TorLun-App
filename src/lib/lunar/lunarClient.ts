import { lunarConfig } from './config'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import https from 'https'

export class LunarClient {
  private agent: https.Agent | undefined

  constructor() {
    if (lunarConfig.mode !== 'mock' && lunarConfig.certPath && lunarConfig.keyPath) {
      try {
        const cert = fs.readFileSync(lunarConfig.certPath)
        const key = fs.readFileSync(lunarConfig.keyPath)
        this.agent = new https.Agent({
          cert,
          key,
          // Optional: ca: fs.readFileSync(...) if required by Lunar
        })
      } catch (err) {
        console.error('Failed to load Lunar mTLS certificates:', err)
      }
    }
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (lunarConfig.mode === 'mock') {
      throw new Error('Use mock data for mock mode')
    }

    const url = `${lunarConfig.apiBaseUrl}${path}`
    const requestId = uuidv4()

    const headers = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
      // @ts-ignore - agent is supported in node-fetch/Next.js fetch on server
      agent: this.agent,
    } as any)

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Lunar API Error (${response.status}): ${body}`)
    }

    return response.json() as Promise<T>
  }
}

export const lunarClient = new LunarClient()
