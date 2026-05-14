export type LunarConnectionStatus = 'not_configured' | 'mock' | 'active' | 'error'

export interface BankAccount {
  id: string
  name: string
  balance: number
  currency: string
  accountNumber?: string
  iban?: string
}

export interface BankTransaction {
  id: string
  accountId: string
  amount: number
  currency: string
  description: string
  date: string
  category?: string
}

export interface BankProvider {
  getAccounts(): Promise<BankAccount[]>
  getTransactions(accountId: string, fromDate: string, toDate: string): Promise<BankTransaction[]>
  getConnectionStatus(): Promise<LunarConnectionStatus>
}
