import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CSVImportClient from './CSVImportClient'

export default async function ImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-10 bg-[#0a0a0a] min-h-screen text-gray-100">
      <header className="border-b border-white/5 pb-8">
        <h1 className="text-3xl font-bold tracking-tight">Importera bankfil</h1>
        <p className="text-gray-500 mt-1">Ladda upp ditt kontoutdrag för att matcha mot räkningar</p>
      </header>

      <CSVImportClient userId={user.id} />
    </main>
  )
}
