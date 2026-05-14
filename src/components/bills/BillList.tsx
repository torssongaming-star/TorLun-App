'use client'

import { Bill, Profile } from '@/types/database'
import BillItem from './BillItem'

interface Props {
  initialBills: Bill[]
  profiles: Profile[]
  currentUserId: string
}

export default function BillList({ initialBills, profiles, currentUserId }: Props) {
  // Sort: Unpaid first, then by date
  const sortedBills = [...initialBills].sort((a, b) => {
    if (a.is_paid === b.is_paid) {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    }
    return a.is_paid ? 1 : -1
  })

  if (sortedBills.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-white/5 p-12 rounded-3xl text-center space-y-2">
        <p className="text-gray-400 font-medium">Inga räkningar den här månaden.</p>
        <p className="text-xs text-gray-600">Allt verkar vara under kontroll!</p>
      </div>
    )
  }

  const unpaid = sortedBills.filter(b => !b.is_paid)
  const paid = sortedBills.filter(b => b.is_paid)

  return (
    <div className="space-y-10">
      {unpaid.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-1">Obetalda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unpaid.map((bill) => (
              <BillItem 
                key={bill.id} 
                bill={bill} 
                profiles={profiles} 
                currentUserId={currentUserId} 
              />
            ))}
          </div>
        </div>
      )}

      {paid.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-1">Betalda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paid.map((bill) => (
              <BillItem 
                key={bill.id} 
                bill={bill} 
                profiles={profiles} 
                currentUserId={currentUserId} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
