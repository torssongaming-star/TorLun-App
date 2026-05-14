'use client'

import { Bill, PaymentMethod } from '@/types/database'
import { useState } from 'react'
import { Check, Clock, User, ArrowRight, CreditCard, Repeat, Building2, FileText, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  bill: Bill
}

export default function BillItem({ bill }: Props) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const togglePaid = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('bills')
      .update({ 
        is_paid: !bill.is_paid,
        paid_at: !bill.is_paid ? new Date().toISOString() : null
      })
      .eq('id', bill.id)

    if (!error) {
      router.refresh()
    }
    setLoading(false)
  }

  const getOwnerName = (owner: string) => {
    if (owner === 'emil') return 'Emil'
    if (owner === 'partner') return 'Emmelinn'
    return 'Gemensam'
  }

  const getMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case 'Autogiro':
        return <span className="bg-blue-500/10 text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1"><Repeat size={10} /> Autogiro</span>
      case 'E-faktura':
        return <span className="bg-purple-500/10 text-purple-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1"><FileText size={10} /> E-faktura</span>
      case 'Bankgiro':
        return <span className="bg-orange-500/10 text-orange-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-orange-500/20 flex items-center gap-1"><Building2 size={10} /> Bankgiro</span>
      default:
        return null
    }
  }

  const isDueSoon = !bill.is_paid && new Date(bill.date).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000

  return (
    <div className={`group bg-[#1a1a1a] border ${isDueSoon ? 'border-red-500/20 shadow-lg shadow-red-500/5' : 'border-white/5'} rounded-3xl p-5 space-y-4 transition-all hover:bg-[#222] active:scale-[0.98]`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-lg tracking-tight">{bill.title}</h3>
            {getMethodBadge(bill.payment_method)}
            {bill.is_recurring && <span className="text-gray-600"><Repeat size={14} /></span>}
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <span>{bill.category || bill.budget_category?.name || 'Övrigt'}</span>
            <span>•</span>
            <span className={isDueSoon ? 'text-red-400 font-bold' : ''}>{bill.date}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-white tracking-tighter">
            {bill.amount.toLocaleString('sv-SE')} <span className="text-xs text-gray-500 font-bold">kr</span>
          </div>
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            {getOwnerName(bill.owner)}
          </div>
        </div>
      </div>

      {(bill.bankgiro_number || bill.ocr_number) && (
        <div className="bg-black/40 rounded-xl p-3 grid grid-cols-2 gap-4 border border-white/5">
          {bill.bankgiro_number && (
            <div className="space-y-1">
              <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Bankgiro</span>
              <p className="text-[10px] font-mono text-gray-300">{bill.bankgiro_number}</p>
            </div>
          )}
          {bill.ocr_number && (
            <div className="space-y-1">
              <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">OCR</span>
              <p className="text-[10px] font-mono text-gray-300">{bill.ocr_number}</p>
            </div>
          )}
        </div>
      )}

      {bill.payment_method === 'Autogiro' && !bill.is_paid && (
        <div className="flex items-center gap-2 text-blue-400/80 text-[10px] font-bold bg-blue-400/5 p-2 rounded-lg border border-blue-400/10">
          <AlertCircle size={12} />
          <span>Förväntas dras automatiskt</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={togglePaid}
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all ${
            bill.is_paid 
              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
              : 'bg-white text-black hover:bg-gray-200 shadow-lg'
          }`}
        >
          {loading ? (
            <Clock className="animate-spin" size={14} />
          ) : bill.is_paid ? (
            <>
              <Check size={14} />
              Betald
            </>
          ) : (
            'Markera som betald'
          )}
        </button>

        {bill.notes && (
          <p className="text-[10px] text-gray-600 italic truncate max-w-[120px]">
            {bill.notes}
          </p>
        )}
      </div>
    </div>
  )
}
