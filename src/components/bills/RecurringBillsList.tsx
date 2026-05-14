'use client'

import { RecurringBill } from '@/types/database'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  recurringBills: RecurringBill[]
  userId: string
}

export default function RecurringBillsList({ recurringBills, userId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const applyRecurring = async (bill: RecurringBill) => {
    setLoadingId(bill.id)
    const { error } = await supabase.from('bills').insert({
      created_by: userId,
      title: bill.title,
      amount: bill.amount,
      date: new Date().toISOString().split('T')[0],
      owner: bill.owner,
      split_type: bill.split_type,
      split_value: bill.split_value,
      paid_by: bill.paid_by,
      category: bill.category,
      is_paid: false
    })

    if (!error) {
      router.refresh()
    }
    setLoadingId(null)
  }

  const deleteRecurring = async (id: string) => {
    if (!confirm('Delete this recurring bill template?')) return
    const { error } = await supabase
      .from('recurring_bills')
      .delete()
      .eq('id', id)

    if (!error) {
      router.refresh()
    }
  }

  if (recurringBills.length === 0) return null

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Calendar size={20} className="text-indigo-500" />
        Recurring Bills
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recurringBills.map((bill) => (
          <div key={bill.id} className="glass-card p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{bill.title}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                {bill.category || 'No Category'} • ${Number(bill.amount).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => applyRecurring(bill)}
                disabled={loadingId === bill.id}
                className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg hover:bg-indigo-500/20 transition-colors flex items-center gap-1 text-sm font-medium"
                title="Add to current month"
              >
                <Plus size={16} />
                {loadingId === bill.id ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={() => deleteRecurring(bill.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
