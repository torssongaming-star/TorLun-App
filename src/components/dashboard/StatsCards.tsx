'use client'

import { Bill, Profile, MonthlyIncome } from '@/types/database'
import { Wallet, Receipt, ArrowRightLeft, CreditCard, User } from 'lucide-react'

interface Props {
  profiles: Profile[]
  bills: Bill[]
  monthlyIncomes: MonthlyIncome[]
}

export default function StatsCards({ profiles, bills, monthlyIncomes }: Props) {
  const totalBills = bills.reduce((sum, b) => sum + Number(b.amount), 0)
  const paidBills = bills.filter(b => b.is_paid).reduce((sum, b) => sum + Number(b.amount), 0)
  const unpaidBills = bills.filter(b => !b.is_paid).reduce((sum, b) => sum + Number(b.amount), 0)
  const unpaidCount = bills.filter(b => !b.is_paid).length

  const emilProfile = profiles.find(p => p.display_name?.toLowerCase() === 'emil')
  const partnerProfile = profiles.find(p => p.display_name?.toLowerCase() === 'emmelinn')

  const emilIncome = Number(monthlyIncomes.find(i => i.profile_id === emilProfile?.id)?.amount || 0)
  const partnerIncome = Number(monthlyIncomes.find(i => i.profile_id === partnerProfile?.id)?.amount || 0)
  const totalNet = emilIncome + partnerIncome

  const emilBills = bills.filter(b => b.owner === 'emil').reduce((sum, b) => sum + Number(b.amount), 0)
  const partnerBills = bills.filter(b => b.owner === 'partner').reduce((sum, b) => sum + Number(b.amount), 0)
  const sharedBills = bills.filter(b => b.owner === 'shared').reduce((sum, b) => sum + Number(b.amount), 0)

  const emilRatio = totalNet > 0 ? emilIncome / totalNet : 0.5
  const partnerRatio = totalNet > 0 ? partnerIncome / totalNet : 0.5

  const emilResponsible = emilBills + (sharedBills * emilRatio)
  const partnerResponsible = partnerBills + (sharedBills * partnerRatio)

  const stats = [
    { label: 'Total nettoinkomst', value: totalNet, icon: Wallet, color: 'text-white' },
    { label: 'Totala räkningar', value: totalBills, icon: Receipt, color: 'text-gray-400' },
    { label: 'Kvar totalt', value: totalNet - totalBills, icon: ArrowRightLeft, color: 'text-indigo-400', primary: true },
    { label: 'Obetalda räkningar', value: `${unpaidCount} st (${unpaidBills.toLocaleString('sv-SE')} kr)`, icon: CreditCard, color: 'text-red-400' },
    { label: 'Kvar Emil', value: emilIncome - emilResponsible, icon: User, color: 'text-gray-300' },
    { label: 'Kvar Emmelinn', value: partnerIncome - partnerResponsible, icon: User, color: 'text-gray-300' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          className={`p-6 rounded-3xl border ${
            stat.primary 
              ? 'bg-indigo-500/10 border-indigo-500/20' 
              : 'bg-[#1a1a1a] border-white/5'
          } flex flex-col justify-between space-y-4`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{stat.label}</span>
            <stat.icon size={18} className={stat.color} />
          </div>
          <div className="flex flex-col">
            <span className={`text-2xl font-bold tracking-tight ${stat.primary ? 'text-white' : 'text-gray-100'}`}>
              {typeof stat.value === 'number' ? `${stat.value.toLocaleString('sv-SE')} kr` : stat.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
