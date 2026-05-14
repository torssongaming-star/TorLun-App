'use client'

import { useState } from 'react'
import { Bill, Profile } from '@/types/database'
import { Check, X, User, Calendar, MessageSquare, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  bill: Bill
  profiles: Profile[]
  currentUserId: string
}

export default function BillItem({ bill, profiles, currentUserId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const responsibleProfile = profiles.find(p => p.display_name?.toLowerCase() === bill.owner?.toLowerCase())
  const paidByProfile = profiles.find(p => p.id === bill.paid_by_user_id)

  const togglePaid = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('bills')
        .update({
          is_paid: !bill.is_paid,
          paid_at: !bill.is_paid ? new Date().toISOString() : null,
          paid_by_user_id: !bill.is_paid ? currentUserId : null
        })
        .eq('id', bill.id)

      if (error) throw error
      router.refresh()
    } catch (err: any) {
      alert('Kunde inte uppdatera status: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-[#1a1a1a] border ${bill.is_paid ? 'border-white/5 opacity-60' : 'border-white/10'} p-5 rounded-3xl space-y-4 transition-all active:scale-[0.98]`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-bold text-white text-lg leading-tight">{bill.title}</h3>
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
            <span className="bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider">{bill.category || 'Övrigt'}</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {bill.date}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-white">{bill.amount.toLocaleString('sv-SE')} kr</p>
          <div className="flex items-center justify-end gap-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
            <User size={10} />
            {bill.owner === 'shared' ? 'Gemensam' : (responsibleProfile?.display_name || bill.owner)}
          </div>
        </div>
      </div>

      {bill.notes && (
        <div className="bg-black/20 p-3 rounded-xl flex items-start gap-2 text-xs text-gray-400 italic">
          <MessageSquare size={14} className="mt-0.5 shrink-0" />
          <p>{bill.notes}</p>
        </div>
      )}

      {bill.is_paid && paidByProfile && (
        <div className="flex items-center gap-2 text-[10px] text-green-500 font-bold uppercase tracking-widest bg-green-500/5 p-2 rounded-xl border border-green-500/10">
          <Clock size={12} />
          <span>Betald av {paidByProfile.display_name} {bill.paid_at && `(${new Date(bill.paid_at).toLocaleDateString()})`}</span>
        </div>
      )}

      <button
        onClick={togglePaid}
        disabled={loading}
        className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
          bill.is_paid
            ? 'bg-white/5 text-gray-400 hover:bg-white/10'
            : 'bg-white text-black hover:bg-gray-200 shadow-lg'
        }`}
      >
        {bill.is_paid ? (
          <>
            <X size={18} />
            Markera som obetald
          </>
        ) : (
          <>
            <Check size={18} />
            Markera som betald
          </>
        )}
      </button>
    </div>
  )
}
