import { lunarClient } from './lunarClient'
import { refreshAccessToken } from './auth'
import { lunarConfig } from './config'
import { LunarTransaction } from './types'
import { createClient } from '@/lib/supabase/server'

export async function fetchTransactions(userId: string, accountId: string, from?: string, to?: string): Promise<LunarTransaction[]> {
  if (lunarConfig.mode === 'mock') {
    return [
      {
        id: 'mock_tx_1',
        amount: -1250,
        currency: 'SEK',
        title: 'Hyresbetalning',
        message: 'Hyra maj 2026',
        transactionTime: new Date().toISOString(),
        status: 'booked',
        type: 'transfer'
      },
      {
        id: 'mock_tx_2',
        amount: -450.20,
        currency: 'SEK',
        title: 'ICA Supermarket',
        transactionTime: new Date().toISOString(),
        status: 'booked',
        type: 'card'
      }
    ]
  }

  const token = await refreshAccessToken(userId)
  const query = new URLSearchParams()
  if (from) query.append('from', from)
  if (to) query.append('to', to)

  const data = await lunarClient.request<{ transactions: any[] }>(`/v1/accounts/${accountId}/transactions?${query.toString()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  return data.transactions.map(tx => ({
    id: tx.id,
    amount: tx.amount.amount,
    currency: tx.amount.currency,
    title: tx.title,
    message: tx.message,
    transactionTime: tx.transactionTime,
    postingTime: tx.postingTime,
    status: tx.status,
    type: tx.type,
    creditorName: tx.creditor?.name,
    debtorName: tx.debtor?.name,
    bgNumber: tx.paymentDetails?.bgNumber,
    pgNumber: tx.paymentDetails?.pgNumber,
    ocr: tx.paymentDetails?.ocr,
    rawJson: tx
  }))
}

export async function syncTransactions(userId: string, accountId: string) {
  const transactions = await fetchTransactions(userId, accountId)
  const supabase = await createClient()

  for (const tx of transactions) {
    await supabase.from('lunar_transactions').upsert({
      user_id: userId,
      lunar_transaction_id: tx.id,
      lunar_account_id: accountId,
      transaction_time: tx.transactionTime,
      posting_time: tx.postingTime,
      amount: tx.amount,
      currency: tx.currency,
      title: tx.title,
      message: tx.message,
      type: tx.type,
      status: tx.status,
      creditor_name: tx.creditorName,
      debtor_name: tx.debtorName,
      bg_number: tx.bgNumber,
      pg_number: tx.pgNumber,
      ocr: tx.ocr,
      raw_json: tx.rawJson,
      updated_at: new Date().toISOString()
    }, { onConflict: 'lunar_transaction_id' })
  }

  return transactions
}
