import { lunarClient } from './lunarClient'
import { refreshAccessToken } from './auth'
import { lunarConfig } from './config'
import { LunarAccount } from './types'
import { createClient } from '@/utils/supabase/server'

export async function fetchAccounts(userId: string): Promise<LunarAccount[]> {
  if (lunarConfig.mode === 'mock') {
    return [
      {
        id: 'mock_acc_1',
        name: 'Privat Konto',
        currency: 'SEK',
        type: 'checking',
        bookedAmount: 15400.50,
        availableAmount: 15400.50,
        ownerName: 'Emil Torsson'
      }
    ]
  }

  const token = await refreshAccessToken(userId)
  const data = await lunarClient.request<{ accounts: any[] }>('/v1/accounts', {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  return data.accounts.map(acc => ({
    id: acc.id,
    name: acc.name,
    currency: acc.currency,
    type: acc.type,
    bban: acc.bban,
    iban: acc.iban,
    availableAmount: acc.balance?.available?.amount,
    bookedAmount: acc.balance?.booked?.amount,
    ownerName: acc.ownerName,
    supportsPayments: acc.supportsPayments
  }))
}

export async function syncAccounts(userId: string) {
  const accounts = await fetchAccounts(userId)
  const supabase = await createClient()

  for (const acc of accounts) {
    await supabase.from('lunar_accounts').upsert({
      user_id: userId,
      lunar_account_id: acc.id,
      name: acc.name,
      currency: acc.currency,
      bban: acc.bban,
      iban: acc.iban,
      balance_amount: acc.bookedAmount,
      balance_available_amount: acc.availableAmount,
      owner_name: acc.ownerName,
      type: acc.type,
      supports_payments: acc.supportsPayments,
      updated_at: new Date().toISOString()
    }, { onConflict: 'lunar_account_id' })
  }

  return accounts
}
