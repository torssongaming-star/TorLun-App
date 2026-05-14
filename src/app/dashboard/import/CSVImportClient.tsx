'use client'

import { useState } from 'react'
import { Upload, FileText, Check, AlertCircle, Loader2, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
}

export default function CSVImportClient({ userId }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setPreview(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('bank', 'Lunar')

    try {
      const res = await fetch('/api/banking/import/parse', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      
      if (res.ok) {
        setPreview(data.transactions)
      } else {
        setError(data.error || 'Kunde inte läsa filen')
      }
    } catch (err) {
      setError('Ett oväntat fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!preview) return
    setLoading(true)
    
    try {
      const res = await fetch('/api/banking/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transactions: preview,
          fileName: file?.name,
          bank: 'Lunar'
        })
      })
      
      if (res.ok) {
        router.push('/dashboard?import=success')
      } else {
        const data = await res.json()
        setError(data.error || 'Kunde inte spara transaktioner')
      }
    } catch (err) {
      setError('Ett fel uppstod vid sparning')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {!preview ? (
        <div className="bg-[#1a1a1a] border border-white/5 p-12 rounded-3xl flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-indigo-500">
            <Upload size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Välj fil att ladda upp</h2>
            <p className="text-sm text-gray-500 mt-1">Ladda upp din exporterade CSV-fil från Lunar</p>
          </div>
          
          <div className="w-full max-w-sm space-y-4">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200 cursor-pointer"
            />
            
            <button 
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full bg-indigo-500 text-white font-bold py-3 rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Läs in fil'}
            </button>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-500/10 px-4 py-2 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-500/10 px-4 py-2 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold">Förhandsgranskning</h2>
            <div className="flex gap-3">
              <button 
                onClick={() => setPreview(null)}
                className="text-sm text-gray-500 hover:text-white"
              >
                Avbryt
              </button>
              <button 
                onClick={handleConfirm}
                disabled={loading}
                className="bg-white text-black text-sm font-bold px-6 py-2 rounded-full hover:bg-gray-200 flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                Bekräfta Import
              </button>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Datum</th>
                  <th className="px-6 py-4">Beskrivning</th>
                  <th className="px-6 py-4 text-right">Belopp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {preview.slice(0, 10).map((tx, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{tx.date}</td>
                    <td className="px-6 py-4 font-medium">{tx.description}</td>
                    <td className={`px-6 py-4 text-right font-bold ${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {tx.amount.toLocaleString('sv-SE')} kr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && (
              <div className="p-4 text-center text-xs text-gray-500 bg-black/20 italic">
                ...och {preview.length - 10} fler transaktioner
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
