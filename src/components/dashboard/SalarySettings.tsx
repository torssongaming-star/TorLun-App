'use client'

import { Profile, MonthlyIncome } from '@/types/database'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Save, Calendar } from 'lucide-react'

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
      router.refresh()
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
        <h3 className="font-semibold text-lg">Månadsinkomster</h3>
        <Calendar size={18} className="text-gray-500" />
      </div>

      <div className="flex gap-2">
        <select 
          value={selectedMonth}
          onChange={(e) => handleMonthYearChange(parseInt(e.target.value), selectedYear)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
        >
          {months.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <select 
          value={selectedYear}
          onChange={(e) => handleMonthYearChange(selectedMonth, parseInt(e.target.value))}
          className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
        >
          {[2024, 2025, 2026, 2027].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      
      <div className="space-y-4">
        {(!profiles || profiles.length === 0) ? (
          <p className="text-xs text-gray-500 italic text-center py-4">
            Inga profiler hittades. Se till att du har skapat din profil i databasen.
          </p>
        ) : (
          profiles.map((profile) => {
            const isEmil = profile.display_name?.toLowerCase().includes('emil') || profile.email.toLowerCase().includes('emil')
            const label = isEmil ? 'Emils nettoinkomst' : 'Emmelinns nettoinkomst'
            
            return (
              <div key={profile.id} className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  {label}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={amounts[profile.id] || '0'}
                    onChange={(e) => setAmounts({ ...amounts, [profile.id]: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-white/20 text-white"
                    placeholder="0"
                  />
                  <button
                    onClick={() => handleSave(profile.id)}
                    disabled={loading}
                    className="p-2 bg-white text-black rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all flex items-center justify-center min-w-[40px]"
                  >
                    <Save size={18} />
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
