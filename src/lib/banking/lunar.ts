import { BankAccount, BankProvider, BankTransaction, LunarConnectionStatus } from './types'

/**
 * Lunar Bank Provider Implementation (Defensive)
 * 
 * IMPORTANT: 
 * Real production access to Lunar via Open Banking/PSD2 requires:
 * 1. TPP (Third Party Provider) registration.
 * 2. eIDAS certificates (QWAC/QSealC).
 * 3. PSD2 license from a national regulator (e.g., Finansinspektionen).
 * 4. Implementation of the redirect/decoupled auth flow for BankID.
 * 
 * This implementation is a skeleton for official API access.
 */
export class LunarBankProvider implements BankProvider {
  private baseUrl = process.env.LUNAR_API_BASE_URL
  private clientId = process.env.LUNAR_CLIENT_ID
  private clientSecret = process.env.LUNAR_CLIENT_SECRET

  private isConfigured(): boolean {
    return !!(this.baseUrl && this.clientId && this.clientSecret)
  }

  async getConnectionStatus(): Promise<LunarConnectionStatus> {
    if (!this.isConfigured()) {
      return 'not_configured'
    }
    // In a real implementation, we would check if we have a valid access token/consent
    return 'active'
  }

  async getAccounts(): Promise<BankAccount[]> {
    if (!this.isConfigured()) {
      throw new Error('Lunar API is not configured. Missing environment variables.')
    }

    // Official PSD2 flow would go here:
    // 1. Get Access Token (OAuth2 Client Credentials or Authorization Code)
    // 2. GET /v1/accounts
    
    return [] // Empty for now
  }

  async getTransactions(accountId: string, fromDate: string, toDate: string): Promise<BankTransaction[]> {
    if (!this.isConfigured()) {
      throw new Error('Lunar API is not configured.')
    }

    // Official PSD2 flow:
    // 1. GET /v1/accounts/{accountId}/transactions?from={fromDate}&to={toDate}
    
    return [] // Empty for now
  }
}
