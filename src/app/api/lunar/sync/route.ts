import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { syncAccounts } from '@/lib/lunar/accounts'
import { syncTransactions } from '@/lib/lunar/transactions'
import { matchTransactionsToBills, MatchResult } from '@/lib/lunar/transactionMatcher'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Sync Accounts
    const accounts = await syncAccounts(user.id)
    
    // 2. Sync Transactions for all accounts
    const allTransactions = []
    for (const acc of accounts) {
      const txs = await syncTransactions(user.id, acc.id)
      allTransactions.push(...txs)
    }

    // 3. Fetch bills for matching
    const { data: bills } = await supabase
      .from('bills')
      .select('*')
      .eq('is_paid', false)

    // 4. Run matcher
    const matches = matchTransactionsToBills(allTransactions, bills || [])

    // 5. Store matches in DB
    for (const match of matches) {
      await supabase.from('bill_transaction_matches').upsert({
        bill_id: match.billId,
        lunar_transaction_id: match.transactionId,
        confidence: match.confidence,
        match_reason: match.reason,
        updated_at: new Date().toISOString()
      }, { onConflict: 'bill_id, lunar_transaction_id' })
    }

    return NextResponse.json({ success: true, accountsCount: accounts.length, matchesCount: matches.length })
  } catch (err: any) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
