'use client'

import { useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function AddBillModal({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Övrigt',
    owner: 'shared',
    notes: '',
    is_recurring: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.amount || !formData.date) {
      alert('Vänligen fyll i alla obligatoriska fält.')
      return
    }

    setLoading(true)
    try {
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert({
          title: formData.title,
          amount: parseFloat(formData.amount),
          date: formData.date,
          category: formData.category,
          owner: formData.owner,
          notes: formData.notes,
          created_by: userId,
          split_type: formData.owner === 'shared' ? '50/50' : 'full',
          paid_by: formData.owner === 'shared' ? 'emil' : formData.owner // Default shared to Emil paying initially
        })
        .select()
        .single()

      if (billError) throw billError

      if (formData.is_recurring && bill) {
        await supabase.from('recurring_bills').insert({
          bill_id: bill.id,
          interval: 'monthly',
          next_due_date: formData.date,
          created_by: userId
        })
      }

      setIsOpen(false)
      setFormData({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Övrigt',
        owner: 'shared',
        notes: '',
        is_recurring: false
      })
      router.refresh()
    } catch (err: any) {
      alert('Ett fel uppstod: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-white text-black p-2 rounded-full shadow-lg hover:bg-gray-200 transition-all flex items-center justify-center"
      >
        <Plus size={24} />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 space-y-8 animate-in slide-in-from-bottom duration-300 border-t sm:border border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white tracking-tight">Ny räkning</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pb-10 sm:pb-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Namn på räkning</label>
              <input 
                type="text" 
                required
                placeholder="T.ex. Hyra, El..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Belopp (SEK)</label>
                <input 
                  type="number" 
                  inputMode="decimal"
                  required
                  placeholder="0"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Förfallodatum</label>
                <input 
                  type="date" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Ansvarig</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 appearance-none"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                >
                  <option value="shared">Gemensam</option>
                  <option value="emil">Emil</option>
                  <option value="partner">Emmelinn</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Kategori</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 appearance-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Bostad">Bostad</option>
                  <option value="Mat">Mat</option>
                  <option value="Transport">Transport</option>
                  <option value="Försäkring">Försäkring</option>
                  <option value="Nöje">Nöje</option>
                  <option value="Övrigt">Övrigt</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Anteckningar (Valfritt)</label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white h-24 focus:outline-none focus:border-indigo-500"
                placeholder="T.ex. OCR-nummer..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-5 rounded-3xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-lg shadow-xl"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Spara räkning'}
          </button>
        </form>
      </div>
    </div>
  )
}
