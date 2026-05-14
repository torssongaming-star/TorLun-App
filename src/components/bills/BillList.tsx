'use client'

import { Bill } from '@/types/database'
import BillItem from './BillItem'

interface Props {
  bills: Bill[]
}

export default function BillList({ bills }: Props) {
  if (bills.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-white/5 p-12 rounded-[2.5rem] text-center space-y-2">
        <p className="text-gray-400 font-medium">Inga räkningar här.</p>
        <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Snyggt jobbat!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {bills.map((bill) => (
        <BillItem key={bill.id} bill={bill} />
      ))}
    </div>
  )
}
