import { Bill } from '@/types/database'
import { LunarTransaction } from './types'

export interface MatchResult {
  billId: string
  transactionId: string
  confidence: number
  reason: string
}

export function matchTransactionsToBills(transactions: any[], bills: Bill[]): MatchResult[] {
  const matches: MatchResult[] = []
  
  // Only match unpaid bills
  const unpaidBills = bills.filter(b => !b.is_paid)

  for (const bill of unpaidBills) {
    for (const tx of transactions) {
      let confidence = 0
      const reasons: string[] = []

      // 1. Amount match (exact match is high confidence)
      const billAmount = Math.abs(Number(bill.amount))
      const txAmount = Math.abs(Number(tx.amount))
      
      if (billAmount === txAmount) {
        confidence += 0.6
        reasons.push('Exakt belopp')
      } else if (Math.abs(billAmount - txAmount) < 5) {
        confidence += 0.2
        reasons.push('Beloppet diffar lite')
      }

      // 2. Date match (near due date)
      const billDate = new Date(bill.date).getTime()
      const txDate = new Date(tx.transaction_time || tx.transactionTime).getTime()
      const diffDays = Math.abs(billDate - txDate) / (1000 * 60 * 60 * 24)

      if (diffDays <= 2) {
        confidence += 0.3
        reasons.push('Nära förfallodatum')
      } else if (diffDays <= 7) {
        confidence += 0.1
        reasons.push('Inom en vecka från förfallodatum')
      }

      // 3. OCR Match
      if (tx.ocr && bill.notes?.includes(tx.ocr)) {
        confidence += 0.9
        reasons.push('Matchande OCR-nummer')
      }

      // 4. Title/Name match
      const billTitle = bill.title.toLowerCase()
      const txTitle = (tx.title || '').toLowerCase()
      const txMsg = (tx.message || '').toLowerCase()
      const txCreditor = (tx.creditor_name || tx.creditorName || '').toLowerCase()

      if (txTitle.includes(billTitle) || txMsg.includes(billTitle) || txCreditor.includes(billTitle)) {
        confidence += 0.4
        reasons.push('Matchande namn/titel')
      }

      // Cap confidence at 1.0
      const finalConfidence = Math.min(confidence, 1.0)

      if (finalConfidence >= 0.5) {
        matches.push({
          billId: bill.id,
          transactionId: tx.lunar_transaction_id || tx.id,
          confidence: finalConfidence,
          reason: reasons.join(', ')
        })
      }
    }
  }

  return matches
}
