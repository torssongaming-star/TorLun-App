import { BankAccount, BankProvider, BankTransaction, LunarConnectionStatus } from './types'

export class MockBankProvider implements BankProvider {
  async getAccounts(): Promise<BankAccount[]> {
    return [
      {
        id: 'acc_1',
        name: 'Lönekonto (Mock)',
        balance: 45200.50,
        currency: 'SEK',
        accountNumber: '1234-5678'
      },
      {
        id: 'acc_2',
        name: 'Sparkonto (Mock)',
        balance: 125000.00,
        currency: 'SEK',
        accountNumber: '8765-4321'
      }
    ]
  }

  async getTransactions(accountId: string, fromDate: string, toDate: string): Promise<BankTransaction[]> {
    return [
      {
        id: 'tx_1',
        accountId,
        amount: -1250.00,
        currency: 'SEK',
        description: 'ICA Supermarket',
        date: new Date().toISOString(),
        category: 'Food'
      },
      {
        id: 'tx_2',
        accountId,
        amount: -8500.00,
        currency: 'SEK',
        description: 'Hyra',
        date: new Date().toISOString(),
        category: 'Housing'
      },
      {
        id: 'tx_3',
        accountId,
        amount: 25000.00,
        currency: 'SEK',
        description: 'Lön',
        date: new Date().toISOString(),
        category: 'Income'
      }
    ]
  }

  async getConnectionStatus(): Promise<LunarConnectionStatus> {
    return 'mock'
  }
}
