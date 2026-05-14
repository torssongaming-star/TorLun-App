'use client'

import { useState } from 'react'
import { Repeat, Loader2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  month: number
  year: number
}

export default function AutomationButton({ month, year }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null)
  const router = useRouter()

  const handleCreateNext = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const res = await fetch('/api/bills/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year })
      })
      
      const data = await res.json()
      if (res.ok) {
        setResult(data)
        router.refresh()
        // Hide result after 5 seconds
        setTimeout(() => setResult(null), 5000)
      } else {
        alert('Ett fel uppstod: ' + data.error)
      }
    } catch (err) {
      alert('Kunde inte kontakta servern')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={handleCreateNext}
        disabled={loading}
        title="Skapa nästa månads räkningar"
        className="bg-white/5 text-gray-400 p-2 rounded-full hover:bg-white/10 transition-all flex items-center justify-center border border-white/5"
      >
        {loading ? <Loader2 className="animate-spin" size={24} /> : <Repeat size={24} />}
      </button>

      {result && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-white text-black px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="bg-green-500/20 text-green-600 p-2 rounded-full">
            <CheckCircle2 size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold">{result.created} räkningar skapades</span>
            <span className="text-[10px] font-medium text-gray-500">{result.skipped} fanns redan och hoppades över</span>
          </div>
        </div>
      )}
    </div>
  )
}
