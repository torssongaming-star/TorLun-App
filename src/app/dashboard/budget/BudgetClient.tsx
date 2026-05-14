'use client'

import { useState } from 'react'
import { BudgetCategory, MonthlyBudget } from '@/types/database'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Save, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  categories: BudgetCategory[]
  initialBudgets: MonthlyBudget[]
  month: number
  year: number
}

export default function BudgetClient({ categories, initialBudgets, month, year }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(
    categories.reduce((acc, cat) => {
      const budget = initialBudgets.find(b => b.category_id === cat.id)
      acc[cat.id] = budget ? budget.budget_amount.toString() : '0'
      return acc
    }, {} as Record<string, string>)
  )
  
  const supabase = createClient()
  const router = useRouter()

  const handleSave = async () => {
    setLoading(true)
    setSuccess(false)

    try {
      const updates = categories.map(cat => ({
        category_id: cat.id,
        month,
        year,
        budget_amount: parseFloat(values[cat.id] || '0')
      }))

      const { error } = await supabase
        .from('monthly_budgets')
        .upsert(updates, { onConflict: 'category_id, month, year' })

      if (error) throw error

      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      alert('Kunde inte spara budget: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] overflow-hidden">
        {categories.map((cat, i) => (
          <div 
            key={cat.id} 
            className={`p-6 flex items-center justify-between gap-4 ${
              i !== categories.length - 1 ? 'border-b border-white/5' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/5 rounded-2xl text-gray-400">
                <span className="text-sm font-bold">{cat.name[0]}</span>
              </div>
              <span className="font-bold text-white">{cat.name}</span>
            </div>
            <div className="relative">
              <input 
                type="number"
                inputMode="decimal"
                className="w-28 bg-white/5 border border-white/10 rounded-xl p-3 text-right text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                value={values[cat.id]}
                onChange={(e) => setValues({ ...values, [cat.id]: e.target.value })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-bold text-gray-500 uppercase">kr</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className={`w-full py-6 rounded-[2.5rem] font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
          success 
            ? 'bg-green-500 text-white' 
            : 'bg-white text-black hover:bg-gray-200'
        }`}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={24} />
        ) : success ? (
          <>
            <CheckCircle2 size={24} />
            Budget sparad!
          </>
        ) : (
          <>
            <Save size={24} />
            Spara budgetering
          </>
        )}
      </button>
    </div>
  )
}
