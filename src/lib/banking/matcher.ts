import { Bill } from '@/types/database'

export interface MatchResult {
  billId: string
  bankTransactionId: string
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
        confidence += 60
        reasons.push('Exakt belopp')
      } else if (Math.abs(billAmount - txAmount) < 5) {
        confidence += 20
        reasons.push('Beloppet diffar lite')
      }

      // 2. Date match (near due date, max 7 days)
      const billDate = new Date(bill.date).getTime()
      const txDate = new Date(tx.transaction_date || tx.date).getTime()
      const diffDays = Math.abs(billDate - txDate) / (1000 * 60 * 60 * 24)

      if (diffDays <= 2) {
        confidence += 30
        reasons.push('Nära förfallodatum')
      } else if (diffDays <= 7) {
        confidence += 10
        reasons.push('Inom en vecka från förfallodatum')
      }

      // 3. Text match against bill name, category, or notes
      const billTitle = (bill.title || '').toLowerCase()
      const billCategory = (bill.category || '').toLowerCase()
      const billNotes = (bill.notes || '').toLowerCase()
      const txDesc = (tx.description || '').toLowerCase()

      if (txDesc.includes(billTitle) && billTitle.length > 2) {
        confidence += 40
        reasons.push('Matchande namn/titel')
      } else if (billCategory && txDesc.includes(billCategory)) {
        confidence += 10
        reasons.push('Matchande kategori')
      } else if (billNotes && txDesc.includes(billNotes)) {
        confidence += 20
        reasons.push('Matchande text i anteckningar')
      }

      // Cap confidence at 100
      const finalConfidence = Math.min(confidence, 100)

      if (finalConfidence >= 50) {
        matches.push({
          billId: bill.id,
          bankTransactionId: tx.id,
          confidence: finalConfidence,
          reason: reasons.join(', ')
        })
      }
    }
  }

  return matches
}
