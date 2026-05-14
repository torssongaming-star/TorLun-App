import { BankProvider } from './types'
import { MockBankProvider } from './mockBankProvider'

export function getBankProvider(): BankProvider {
  // Since Lunar API is removed, we default to MockBankProvider for now
  // or you can implement a new provider here.
  return new MockBankProvider()
}
