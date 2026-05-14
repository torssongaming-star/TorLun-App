'use client'

import { useState } from 'react'
import { Loader2, Link2, RefreshCw, Unlink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  status: string
}

export default function BankingStatusClient({ status }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleConnect = () => {
    window.location.href = '/api/lunar/connect'
  }

  const handleSync = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/lunar/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        alert(`Synk klar! Hittade ${data.matchesCount} nya matchningar.`)
        router.refresh()
      } else {
        alert('Synk misslyckades: ' + data.error)
      }
    } catch (err) {
      alert('Ett fel uppstod vid synkning.')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Är du säker på att du vill koppla från Lunar? Din transaktionshistorik behålls men inga nya transaktioner hämtas.')) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/lunar/disconnect', { method: 'POST' })
      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      alert('Ett fel uppstod.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {status === 'connected' ? (
        <>
          <button 
            onClick={handleSync}
            disabled={loading}
            className="bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={18} />}
            Synka transaktioner
          </button>
          <button 
            onClick={handleDisconnect}
            disabled={loading}
            className="bg-red-500/10 text-red-500 border border-red-500/20 font-bold py-4 rounded-xl hover:bg-red-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Unlink size={18} />
            Koppla från
          </button>
        </>
      ) : (
        <button 
          onClick={handleConnect}
          disabled={loading}
          className="col-span-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <Link2 size={18} />
          Koppla Lunar Bank
        </button>
      )}
    </div>
  )
}
