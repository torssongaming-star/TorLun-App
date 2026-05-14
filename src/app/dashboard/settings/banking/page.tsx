import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BankingStatusClient from './BankingStatusClient'

export default async function BankingSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get Lunar connection status from DB
  const { data: connection } = await supabase
    .from('lunar_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const status = connection?.status || 'not_configured'

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-10 bg-[#0a0a0a] min-h-screen text-gray-100">
      <header className="border-b border-white/5 pb-8">
        <h1 className="text-3xl font-bold tracking-tight">Bankkoppling</h1>
        <p className="text-gray-500 mt-1">Hantera anslutningar till dina bankkonton</p>
      </header>

      <section className="bg-[#1a1a1a] border border-white/5 p-8 rounded-3xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Lunar Bank</h2>
            <p className="text-sm text-gray-500 mt-1">Hämta transaktioner och matcha mot dina räkningar</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              status === 'connected' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
              status === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
              'bg-white/5 text-gray-500 border border-white/5'
            }`}>
              {status === 'connected' ? 'Kopplad' : 
               status === 'error' ? 'Fel' : 
               status === 'disconnected' ? 'Frånkopplad' : 'Ej konfigurerad'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">Säkerhet</h3>
            <ul className="text-xs text-gray-500 space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                Officiell Open Banking API
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                Endast läsåtkomst (PSD2)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                Ingen BankID-automation
              </li>
            </ul>
          </div>
          <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">Synkronisering</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Vi hämtar dina transaktioner och försöker matcha dem mot dina obetalda räkningar baserat på belopp och datum.
            </p>
          </div>
        </div>

        <BankingStatusClient status={status} />
      </section>
    </main>
  )
}
