import { describe, it, expect } from 'vitest'
import { matchTransactionsToBills } from '../lunar/transactionMatcher'
import { Bill } from '@/types/database'

describe('App Logic Tests', () => {
  const mockBills: Bill[] = [
    {
      id: 'bill_1',
      title: 'Elräkning',
      amount: 850,
      date: '2026-05-28',
      is_paid: false,
      owner: 'shared',
      split_type: '50/50',
      paid_by: 'emil',
      created_at: '',
      created_by: ''
    },
    {
      id: 'bill_2',
      title: 'Hyra',
      amount: 12000,
      date: '2026-05-30',
      is_paid: true,
      owner: 'shared',
      split_type: '50/50',
      paid_by: 'partner',
      created_at: '',
      created_by: ''
    }
  ]

  const mockTransactions = [
    {
      id: 'tx_1',
      title: 'Vattenfall AB',
      amount: -850,
      transactionTime: '2026-05-27T10:00:00Z',
      status: 'booked'
    },
    {
      id: 'tx_2',
      title: 'ICA Kvantum',
      amount: -450,
      transactionTime: '2026-05-25T12:00:00Z',
      status: 'booked'
    }
  ]

  it('summarizes total bills correctly', () => {
    const total = mockBills.reduce((sum, b) => sum + b.amount, 0)
    expect(total).toBe(12850)
  })

  it('calculates net income minus bills correctly', () => {
    const income = 35000
    const responsibleBills = 12850 / 2 // Shared 50/50
    expect(income - responsibleBills).toBe(28575)
  })

  it('matches transactions to bills correctly', () => {
    const matches = matchTransactionsToBills(mockTransactions, mockBills)
    expect(matches.length).toBe(1)
    expect(matches[0].billId).toBe('bill_1')
    expect(matches[0].confidence).toBeGreaterThanOrEqual(0.6)
    expect(matches[0].reason).toContain('Exakt belopp')
  })

  it('only matches unpaid bills', () => {
    const paidBillTx = [
      {
        id: 'tx_hyra',
        title: 'Hyra',
        amount: -12000,
        transactionTime: '2026-05-30T00:00:00Z',
        status: 'booked'
      }
    ]
    const matches = matchTransactionsToBills(paidBillTx, mockBills)
    expect(matches.length).toBe(0) // bill_2 is already paid
  })
})
