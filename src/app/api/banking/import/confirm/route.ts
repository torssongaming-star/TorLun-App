import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import crypto from 'crypto'
import { matchTransactionsToBills } from '@/lib/banking/matcher'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { transactions, fileName, bank } = await req.json()

    // 1. Calculate file hash to prevent double import of same file
    const fileHash = crypto.createHash('md5')
      .update(JSON.stringify(transactions) + fileName)
      .digest('hex')

    // 2. Create bank_import record
    const { data: importRecord, error: importError } = await supabase
      .from('bank_imports')
      .insert({
        user_id: user.id,
        bank_name: bank,
        file_name: fileName,
        file_hash: fileHash
      })
      .select()
      .single()

    if (importError) {
      if (importError.code === '23505') {
        return NextResponse.json({ error: 'Denna fil har redan importerats' }, { status: 400 })
      }
      throw importError
    }

    // 3. Save transactions
    const savedTransactions = []
    for (const tx of transactions) {
      const { data: savedTx, error: txError } = await supabase
        .from('bank_transactions')
        .upsert({
          user_id: user.id,
          bank_import_id: importRecord.id,
          transaction_date: tx.date,
          description: tx.description,
          amount: tx.amount,
          balance: tx.balance,
          currency: tx.currency,
          raw_data: tx.raw,
          transaction_hash: tx.hash
        }, { onConflict: 'transaction_hash' })
        .select()
        .single()

      if (savedTx) savedTransactions.push(savedTx)
    }

    // 4. Run matching logic
    const { data: bills } = await supabase
      .from('bills')
      .select('*')
      .eq('is_paid', false)

    const matches = matchTransactionsToBills(savedTransactions, bills || [])

    // 5. Save matches
    for (const match of matches) {
      await supabase.from('bill_transaction_matches').upsert({
        bill_id: match.billId,
        bank_transaction_id: match.bankTransactionId,
        confidence: match.confidence,
        match_reason: match.reason
      }, { onConflict: 'bill_id, bank_transaction_id' })
    }

    return NextResponse.json({ 
      success: true, 
      count: savedTransactions.length,
      matchesCount: matches.length 
    })
  } catch (err: any) {
    console.error('CSV Confirm error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
