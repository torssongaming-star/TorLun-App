import { BankProvider } from './types'
import { MockBankProvider } from './mockBankProvider'
import { LunarBankProvider } from './lunar'

export function getBankProvider(): BankProvider {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_BANK === 'true'
  
  if (useMock) {
    return new MockBankProvider()
  }
  
  return new LunarBankProvider()
}
