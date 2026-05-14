'use client'

import { useState } from 'react'
import { Check, X, RefreshCw, AlertCircle, Banknote } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Match {
  id: string
  bill_title: string
  bill_amount: number
  bill_date: string
  tx_description: string
  tx_amount: number
  tx_date: string
  confidence: number
  match_reason: string
  bill_id: string
  bank_transaction_id: string
}

interface Props {
  matches: Match[]
}

export default function TransactionMatches({ matches }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleApprove = async (match: Match) => {
    setLoading(match.id)
    try {
      const res = await fetch('/api/banking/matches/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          matchId: match.id, 
          billId: match.bill_id,
          transactionDate: match.tx_date
        })
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      alert('Ett fel uppstod.')
    } finally {
      setLoading(null)
    }
  }

  const handleIgnore = async (matchId: string) => {
    setLoading(matchId)
    try {
      const res = await fetch('/api/banking/matches/ignore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId })
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      alert('Ett fel uppstod.')
    } finally {
      setLoading(null)
    }
  }

  if (matches.length === 0) return null

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 px-1">
        <h2 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Föreslagna matchningar</h2>
        <div className="bg-indigo-500/10 text-indigo-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
          {matches.length} nya
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {matches.map((match) => (
          <div key={match.id} className="bg-[#1a1a1a] border border-indigo-500/10 p-6 rounded-3xl flex flex-col md:flex-row justify-between gap-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 transition-all group-hover:w-2" />
            
            <div className="flex-1 space-y-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Räkning i appen</p>
                  <h4 className="font-bold text-white text-lg">{match.bill_title}</h4>
                  <p className="text-sm text-gray-400">{match.bill_amount.toLocaleString('sv-SE')} kr • {match.bill_date}</p>
                </div>
                
                <div className="flex flex-col items-center justify-center bg-white/5 p-3 rounded-2xl min-w-[80px]">
                  <Banknote size={16} className="text-indigo-400 mb-1" />
                  <p className="text-[10px] font-bold text-white">{Math.round(match.confidence)}%</p>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Banktransaktion</p>
                  <h4 className="font-bold text-white text-lg truncate max-w-[150px]">{match.tx_description}</h4>
                  <p className="text-sm text-gray-400">{Math.abs(match.tx_amount).toLocaleString('sv-SE')} kr • {match.tx_date}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-[11px] text-indigo-300/80 font-medium bg-indigo-500/5 px-3 py-2 rounded-xl border border-indigo-500/10">
                <AlertCircle size={14} className="text-indigo-400" />
                <span>Anledning: {match.match_reason}</span>
              </div>
            </div>

            <div className="flex md:flex-col justify-end gap-3 min-w-[140px]">
              <button
                onClick={() => handleApprove(match)}
                disabled={!!loading}
                className="flex-1 md:flex-none bg-white text-black px-6 py-3 rounded-2xl text-xs font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                {loading === match.id ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
                Godkänn
              </button>
              <button
                onClick={() => handleIgnore(match.id)}
                disabled={!!loading}
                className="flex-1 md:flex-none bg-white/5 text-gray-500 px-6 py-3 rounded-2xl text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <X size={14} />
                Ignorera
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
