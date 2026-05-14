export interface LunarConfig {
  mode: 'mock' | 'sandbox' | 'production'
  clientId: string
  clientSecret: string
  redirectUri: string
  authBaseUrl: string
  apiBaseUrl: string
  certPath?: string
  keyPath?: string
  tokenEncryptionKey: string
}

export interface LunarTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  refresh_token_expires_in?: number
  token_type: string
  scope: string
}

export interface LunarAccount {
  id: string
  name: string
  currency: string
  type: string
  bban?: string
  iban?: string
  availableAmount?: number
  bookedAmount?: number
  ownerName?: string
  supportsPayments?: boolean
}

export interface LunarTransaction {
  id: string
  amount: number
  currency: string
  title: string
  message?: string
  transactionTime: string
  postingTime?: string
  status: 'booked' | 'pending'
  type: string
  creditorName?: string
  debtorName?: string
  bgNumber?: string
  pgNumber?: string
  ocr?: string
  rawJson?: any
}

export interface TransactionMatch {
  billId: string
  transactionId: string
  confidence: number
  reason: string
}
