import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BillList from '@/components/bills/BillList'
import StatsCards from '@/components/dashboard/StatsCards'
import MonthSwitcher from '@/components/dashboard/MonthSwitcher'
import TransactionMatches from '@/components/dashboard/TransactionMatches'
import { Bill, Profile, MonthlyIncome } from '@/types/database'
import AddBillModal from '@/components/bills/AddBillModal'
import SalarySettings from '@/components/dashboard/SalarySettings'
import Link from 'next/link'
import { FileUp, Settings as SettingsIcon } from 'lucide-react'

interface Props {
  searchParams: Promise<{ month?: string; year?: string; import?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const { month: spMonth, year: spYear, import: importStatus } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const now = new Date()
  const month = parseInt(spMonth || (now.getMonth() + 1).toString())
  const year = parseInt(spYear || now.getFullYear().toString())

  const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

  const { data: bills } = await supabase
    .from('bills')
    .select('*')
    .gte('date', firstDay)
    .lte('date', lastDay)
    .order('date', { ascending: true })

  const { data: monthlyIncomes } = await supabase
    .from('monthly_incomes')
    .select('*')
    .eq('month', month)
    .eq('year', year)

  let { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
  
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
  }

  let profiles = (profilesData as Profile[]) || []

  // If the current user doesn't have a profile yet, create it
  if (!profiles.find(p => p.id === user.id)) {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        display_name: user.user_metadata.display_name || user.email?.split('@')[0]
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating profile:', insertError)
    } else if (newProfile) {
      profiles = [...profiles, newProfile]
    }
  }

  // Fetch recent bank transactions
  const { data: recentTransactions } = await supabase
    .from('bank_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: matches } = await supabase
    .from('bill_transaction_matches')
    .select(`
      id,
      confidence,
      match_reason,
      bill_id,
      bank_transaction_id,
      bill:bills(title, amount, date),
      transaction:bank_transactions(description, amount, transaction_date)
    `)
    .is('approved_at', null)
    .is('ignored_at', null)

  const formattedMatches = (matches || []).map((m: any) => ({
    id: m.id,
    bill_title: m.bill.title,
    bill_amount: m.bill.amount,
    bill_date: m.bill.date,
    tx_description: m.transaction.description,
    tx_amount: m.transaction.amount,
    tx_date: m.transaction.transaction_date,
    confidence: m.confidence,
    match_reason: m.match_reason,
    bill_id: m.bill_id,
    bank_transaction_id: m.bank_transaction_id
  }))

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-10 pb-32">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white tracking-tight">Välkommen</h1>
          <div className="flex items-center gap-2">
             <Link href="/dashboard/settings/banking" className="p-2 bg-white/5 rounded-full text-gray-400">
               <SettingsIcon size={20} />
             </Link>
          </div>
        </div>
        
        <div className="flex items-center justify-between bg-[#1a1a1a] p-2 rounded-full border border-white/5">
          <MonthSwitcher />
          <AddBillModal userId={user.id} />
        </div>
      </header>

      {importStatus === 'success' && (
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-3xl text-green-500 text-sm font-bold flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Importen lyckades!
        </div>
      )}

      {formattedMatches.length > 0 && (
        <TransactionMatches matches={formattedMatches} />
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Ekonomisk Översikt</h2>
        </div>
        <StatsCards 
          profiles={profiles as Profile[] || []} 
          bills={bills as Bill[] || []} 
          monthlyIncomes={monthlyIncomes as MonthlyIncome[] || []}
        />
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Månadens räkningar</h2>
          <Link href="/dashboard/import" className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
            <FileUp size={12} />
            Importera CSV
          </Link>
        </div>
        <BillList 
          initialBills={bills as Bill[] || []} 
          profiles={profiles as Profile[] || []}
          currentUserId={user.id}
        />
      </section>

      <section className="space-y-6 pt-10 border-t border-white/5">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-1 text-center">Inställningar för månaden</h2>
        <SalarySettings 
          profiles={profiles as Profile[] || []} 
          initialIncomes={monthlyIncomes as MonthlyIncome[] || []}
          currentUserId={user.id}
          selectedMonth={month}
          selectedYear={year}
        />
      </section>

      {/* Show recent bank transactions for confirmation */}
      {recentTransactions && recentTransactions.length > 0 && (
        <section className="space-y-4 pt-10 border-t border-white/5 opacity-50">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-center">Senaste importerade transaktioner</h2>
          <div className="max-w-md mx-auto bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/5">
            {recentTransactions.map((tx: any) => (
              <div key={tx.id} className="p-3 border-b border-white/5 last:border-0 flex justify-between items-center text-[10px]">
                <div className="flex flex-col">
                  <span className="font-bold text-gray-300 truncate max-w-[150px]">{tx.description}</span>
                  <span className="text-gray-600">{tx.transaction_date}</span>
                </div>
                <span className={`font-bold ${tx.amount < 0 ? 'text-red-500/70' : 'text-green-500/70'}`}>
                  {tx.amount.toLocaleString('sv-SE')} kr
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
