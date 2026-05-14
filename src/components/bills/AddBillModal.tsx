'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Loader2, CreditCard, Repeat, Building2, Tag } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { PaymentMethod, BudgetCategory } from '@/types/database'

export default function AddBillModal({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category_id: '',
    owner: 'shared' as const,
    notes: '',
    payment_method: 'Manuell betalning' as PaymentMethod,
    is_recurring: false,
    auto_create_next_month: false,
    ocr_number: '',
    bankgiro_number: ''
  })

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      
      if (data) {
        setCategories(data)
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, category_id: data[0].id }))
        }
      }
    }
    if (isOpen) fetchCategories()
  }, [isOpen, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.amount || !formData.date || !formData.category_id) {
      alert('Vänligen fyll i alla obligatoriska fält.')
      return
    }

    setLoading(true)
    try {
      const { error: billError } = await supabase
        .from('bills')
        .insert({
          title: formData.title,
          amount: parseFloat(formData.amount),
          date: formData.date,
          category_id: formData.category_id,
          owner: formData.owner,
          notes: formData.notes,
          created_by: userId,
          split_type: formData.owner === 'shared' ? '50/50' : 'full',
          paid_by: formData.owner === 'shared' ? 'emil' : formData.owner,
          payment_method: formData.payment_method,
          is_recurring: formData.is_recurring,
          auto_create_next_month: formData.auto_create_next_month,
          ocr_number: formData.ocr_number || null,
          bankgiro_number: formData.bankgiro_number || null
        })

      if (billError) throw billError

      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      alert('Ett fel uppstod: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const showOCR = formData.payment_method === 'Bankgiro' || formData.payment_method === 'E-faktura'

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
      <div className="bg-[#0a0a0a] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 space-y-8 animate-in slide-in-from-bottom duration-300 border-t sm:border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white tracking-tight">Ny räkning</h2>
          <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Namn på räkning</label>
              <input 
                type="text" required placeholder="T.ex. Hyra, El..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Belopp (SEK)</label>
                <input 
                  type="number" inputMode="decimal" required placeholder="0"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500"
                  value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Förfallodatum</label>
                <input 
                  type="date" required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500"
                  value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Budgetkategori</label>
              <div className="relative">
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 appearance-none"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#1a1a1a] text-white">{c.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <Tag size={18} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Betalningsmetod</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Autogiro', 'E-faktura', 'Bankgiro', 'Kortbetalning', 'Swish', 'Manuell betalning'] as PaymentMethod[]).map(m => (
                  <button
                    key={m} type="button" onClick={() => setFormData({ ...formData, payment_method: m })}
                    className={`p-3 rounded-xl text-[10px] font-bold text-center border transition-all ${
                      formData.payment_method === m 
                        ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                        : 'bg-white/5 border-white/5 text-gray-500'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {showOCR && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1 flex items-center gap-1">
                    <Building2 size={10} /> Bankgiro
                  </label>
                  <input 
                    type="text" placeholder="5555-4444"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none"
                    value={formData.bankgiro_number} onChange={(e) => setFormData({ ...formData, bankgiro_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">OCR Nummer</label>
                  <input 
                    type="text" placeholder="12345..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none"
                    value={formData.ocr_number} onChange={(e) => setFormData({ ...formData, ocr_number: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Ansvarig</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none appearance-none"
                value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value as any })}
              >
                <option value="shared" className="bg-[#1a1a1a] text-white">Gemensam</option>
                <option value="emil" className="bg-[#1a1a1a] text-white">Emil</option>
                <option value="partner" className="bg-[#1a1a1a] text-white">Emmelinn</option>
              </select>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-3xl space-y-4 border border-white/5">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Repeat size={16} /></div>
                  <div>
                    <p className="text-sm font-bold text-white">Återkommande</p>
                    <p className="text-[10px] text-gray-500">Sker varje månad</p>
                  </div>
                </div>
                <input 
                  type="checkbox" className="w-5 h-5 rounded-md border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500"
                  checked={formData.is_recurring} onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                />
              </label>

              {formData.is_recurring && (
                <label className="flex items-center justify-between cursor-pointer group pt-4 border-t border-white/5 animate-in slide-in-from-top duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><Plus size={16} /></div>
                    <div>
                      <p className="text-sm font-bold text-white">Autoskapande</p>
                      <p className="text-[10px] text-gray-500">Skapa automatiskt nästa månad</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" className="w-5 h-5 rounded-md border-white/10 bg-white/5 text-green-500 focus:ring-green-500"
                    checked={formData.auto_create_next_month} onChange={(e) => setFormData({ ...formData, auto_create_next_month: e.target.checked })}
                  />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Anteckningar (Valfritt)</label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white h-20 focus:outline-none"
                placeholder="T.ex. Kundnummer..."
                value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-white text-black font-bold py-5 rounded-[2rem] hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-lg shadow-xl"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Spara räkning'}
          </button>
        </form>
      </div>
    </div>
  )
}
