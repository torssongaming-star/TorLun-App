import Papa from 'papaparse'
import crypto from 'crypto'

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  balance?: number
  currency: string
  hash: string
  raw: any
}

const DATE_COL_NAMES = ['datum', 'date', 'bokföringsdag', 'transaktionsdatum']
const DESC_COL_NAMES = ['beskrivning', 'description', 'text', 'meddelande', 'mottagare/avsändare']
const AMOUNT_COL_NAMES = ['belopp', 'amount', 'summa']
const BALANCE_COL_NAMES = ['saldo', 'balance', 'behållning']

export function parseBankCSV(csvString: string, bankName: string = 'Lunar'): ParsedTransaction[] {
  const { data, errors } = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.toLowerCase().trim()
  })

  if (errors.length > 0) {
    throw new Error('Kunde inte läsa CSV-filen: ' + errors[0].message)
  }

  const transactions: ParsedTransaction[] = []

  for (const row of data as any[]) {
    // Find columns
    const dateKey = Object.keys(row).find(k => DATE_COL_NAMES.includes(k))
    const descKey = Object.keys(row).find(k => DESC_COL_NAMES.includes(k))
    const amountKey = Object.keys(row).find(k => AMOUNT_COL_NAMES.includes(k))
    const balanceKey = Object.keys(row).find(k => BALANCE_COL_NAMES.includes(k))

    if (!dateKey || !descKey || !amountKey) continue

    const rawAmount = row[amountKey]
    // Handle Swedish decimal comma and spaces
    const amount = parseFloat(rawAmount.toString().replace(/\s/g, '').replace(',', '.'))
    
    if (isNaN(amount)) continue

    const dateStr = row[dateKey]
    const description = row[descKey]
    const balanceStr = balanceKey ? row[balanceKey] : undefined
    const balance = balanceStr ? parseFloat(balanceStr.toString().replace(/\s/g, '').replace(',', '.')) : undefined

    // Create unique hash for duplicate detection
    const hash = crypto.createHash('md5')
      .update(`${bankName}|${dateStr}|${amount}|${description}`)
      .digest('hex')

    transactions.push({
      date: dateStr,
      description,
      amount,
      balance,
      currency: 'SEK',
      hash,
      raw: row
    })
  }

  return transactions
}
