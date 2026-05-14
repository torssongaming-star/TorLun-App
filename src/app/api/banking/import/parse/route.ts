import { NextRequest, NextResponse } from 'next/server'
import { parseBankCSV } from '@/lib/banking/csvParser'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const bank = formData.get('bank') as string

    if (!file) {
      return NextResponse.json({ error: 'Ingen fil uppladdad' }, { status: 400 })
    }

    const csvString = await file.text()
    const transactions = parseBankCSV(csvString, bank)

    return NextResponse.json({ transactions })
  } catch (err: any) {
    console.error('CSV Parse error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
