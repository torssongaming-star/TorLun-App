import { NextRequest, NextResponse } from 'next/server'
import { createNextMonthBills } from '@/lib/bills/automation'

export async function POST(req: NextRequest) {
  try {
    const { month, year } = await req.json()
    
    if (!month || !year) {
      return NextResponse.json({ error: 'Månad och år saknas' }, { status: 400 })
    }

    const result = await createNextMonthBills(month, year)
    
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Automation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
