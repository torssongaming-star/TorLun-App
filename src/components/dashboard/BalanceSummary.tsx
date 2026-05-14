import { Bill } from '@/types/database'
import { Wallet, TrendingUp } from 'lucide-react'

interface Props {
  bills: Bill[]
}

export default function BalanceSummary({ bills }: Props) {
  // Logic to calculate balance
  // Net = (What partner owes Emil) - (What Emil owes partner)
  
  const calculateBalance = () => {
    let emilOwesPartner = 0 // Emil's share of bills partner paid
    let partnerOwesEmil = 0 // Partner's share of bills emil paid

    bills.forEach(bill => {
      const amount = Number(bill.amount)
      
      // Calculate share
      let emilShare = 0
      let partnerShare = 0

      if (bill.owner === 'emil') {
        emilShare = amount
      } else if (bill.owner === 'partner') {
        partnerShare = amount
      } else { // shared
        if (bill.split_type === '50/50') {
          emilShare = amount / 2
          partnerShare = amount / 2
        } else if (bill.split_type === 'percentage') {
          const emilPct = bill.split_value || 50
          emilShare = (amount * emilPct) / 100
          partnerShare = amount - emilShare
        }
      }

      // Who paid?
      if (bill.paid_by === 'emil') {
        partnerOwesEmil += partnerShare
      } else {
        emilOwesPartner += emilShare
      }
    })

    return {
      net: partnerOwesEmil - emilOwesPartner
    }
  }

  const { net } = calculateBalance()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="glass-card p-6 flex items-center gap-4">
        <div className={`p-3 rounded-full ${net >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
          <Wallet size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Net Balance</p>
          <p className="text-2xl font-bold">
            {net >= 0 ? `+ $${net.toFixed(2)}` : `- $${Math.abs(net).toFixed(2)}`}
          </p>
          <p className="text-xs text-gray-400">
            {net >= 0 ? 'Partner owes you' : 'You owe Partner'}
          </p>
        </div>
      </div>

      <div className="glass-card p-6 flex items-center gap-4">
        <div className="p-3 rounded-full bg-indigo-500/20 text-indigo-500">
          <TrendingUp size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Total Monthly Spent</p>
          <p className="text-2xl font-bold">
            ${bills.reduce((acc, b) => acc + Number(b.amount), 0).toFixed(2)}
          </p>
          <p className="text-xs text-gray-400">Combined expenses</p>
        </div>
      </div>
    </div>
  )
}
