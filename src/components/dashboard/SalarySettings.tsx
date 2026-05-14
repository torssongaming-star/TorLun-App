'use client'

import { Profile, MonthlyIncome } from '@/types/database'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Save, Calendar, Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  profiles: Profile[]
  initialIncomes: MonthlyIncome[]
  currentUserId: string
  selectedMonth: number
  selectedYear: number
  onMonthChange?: (month: number, year: number) => void
}

export default function SalarySettings({ 
  profiles, 
  initialIncomes, 
  currentUserId,
  selectedMonth,
  selectedYear,
  onMonthChange
}: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [success, setSuccess] = useState<Record<string, boolean>>({})
  
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  // Sync amounts with initialIncomes when they change
  useEffect(() => {
    const map: Record<string, string> = {}
    profiles.forEach(p => {
      const income = initialIncomes.find(i => i.profile_id === p.id)
      map[p.id] = income ? income.amount.toString() : '0'
    })
    setAmounts(map)
  }, [initialIncomes, profiles])

  const handleSave = async (profileId: string) => {
    setLoading(true)
    const amount = parseFloat(amounts[profileId]) || 0
    
    // Upsert monthly income
    const { error } = await supabase
      .from('monthly_incomes')
      .upsert({ 
        profile_id: profileId,
        month: selectedMonth,
        year: selectedYear,
        amount: amount
      }, { onConflict: 'profile_id, month, year' })

    if (!error) {
      setSuccess({ ...success, [profileId]: true })
      router.refresh()
      setTimeout(() => setSuccess(prev => ({ ...prev, [profileId]: false })), 3000)
    } else {
      alert('Kunde inte spara inkomst: ' + error.message)
    }
    setLoading(false)
  }

  const handleMonthYearChange = (month: number, year: number) => {
    router.push(`/dashboard?month=${month}&year=${year}`)
  }

  const months = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ]

  return (
    <div className="bg-[#1a1a1a] border border-white/5 p-6 rounded-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-white">Månadsinkomster</h3>
        <Calendar size={18} className="text-gray-500" />
      </div>

      <div className="flex gap-2">
        <select 
          value={selectedMonth}
          onChange={(e) => handleMonthYearChange(parseInt(e.target.value), selectedYear)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none appearance-none"
        >
          {months.map((m, i) => (
            <option key={m} value={i + 1} className="bg-[#1a1a1a] text-white">{m}</option>
          ))}
        </select>
        <select 
          value={selectedYear}
          onChange={(e) => handleMonthYearChange(selectedMonth, parseInt(e.target.value))}
          className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none appearance-none"
        >
          {[2024, 2025, 2026, 2027].map(y => (
            <option key={y} value={y} className="bg-[#1a1a1a] text-white">{y}</option>
          ))}
        </select>
      </div>
      
      <div className="space-y-4">
        {(!profiles || profiles.length === 0) ? (
          <p className="text-xs text-gray-500 italic text-center py-4">
            Inga profiler hittades.
          </p>
        ) : (
          profiles.map((profile) => {
            const isEmil = profile.display_name?.toLowerCase().includes('emil') || profile.email.toLowerCase().includes('emil')
            const label = isEmil ? 'Emils nettoinkomst' : 'Emmelinns nettoinkomst'
            const isSuccessful = success[profile.id]
            
            return (
              <div key={profile.id} className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {label}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={amounts[profile.id] || '0'}
                      onChange={(e) => setAmounts({ ...amounts, [profile.id]: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/20 text-white font-bold"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500 uppercase">kr</span>
                  </div>
                  <button
                    onClick={() => handleSave(profile.id)}
                    disabled={loading}
                    className={`p-3 rounded-xl transition-all flex items-center justify-center min-w-[48px] ${
                      isSuccessful ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : isSuccessful ? <CheckCircle2 size={20} /> : <Save size={20} />}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
