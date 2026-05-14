import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { matchId, billId } = await req.json()

  try {
    // 1. Mark bill as paid
    const { error: billError } = await supabase
      .from('bills')
      .update({
        is_paid: true,
        paid_at: new Date().toISOString(),
        paid_by_user_id: user.id
      })
      .eq('id', billId)

    if (billError) throw billError

    // 2. Mark match as approved
    const { error: matchError } = await supabase
      .from('bill_transaction_matches')
      .update({
        approved_by_user_id: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', matchId)

    if (matchError) throw matchError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
