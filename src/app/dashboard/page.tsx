import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BillList from '@/components/bills/BillList'
import StatsCards from '@/components/dashboard/StatsCards'
import MonthSwitcher from '@/components/dashboard/MonthSwitcher'
import TransactionMatches from '@/components/dashboard/TransactionMatches'
import { Bill, Profile, MonthlyIncome, BudgetCategory, MonthlyBudget } from '@/types/database'
import AddBillModal from '@/components/bills/AddBillModal'
import SalarySettings from '@/components/dashboard/SalarySettings'
import Link from 'next/link'
import { FileUp, Settings as SettingsIcon, AlertCircle, CheckCircle2, ChevronDown, Repeat, ArrowRight, Wallet } from 'lucide-react'
import AutomationButton from '@/components/dashboard/AutomationButton'

interface Props {
  searchParams: Promise<{ month?: string; year?: string; import?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const { month: spMonth, year: spYear, import: importStatus } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const now = new Date()
  const month = parseInt(spMonth || (now.getMonth() + 1).toString())
  const year = parseInt(spYear || now.getFullYear().toString())

  const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

  // 1. Fetch Bills
  const { data: billsData } = await supabase
    .from('bills')
    .select('*, budget_category:budget_categories(*)')
    .gte('date', firstDay)
    .lte('date', lastDay)
    .order('date', { ascending: true })
  
  const bills = (billsData as Bill[]) || []

  // 2. Fetch Profiles & Incomes
  let { data: profilesData } = await supabase.from('profiles').select('*')
  let profiles = (profilesData as Profile[]) || []
  if (!profiles.find(p => p.id === user.id)) {
    const { data: newProfile } = await supabase.from('profiles').insert({
      id: user.id, email: user.email!, display_name: user.user_metadata.display_name || user.email?.split('@')[0]
    }).select().single()
    if (newProfile) profiles = [...profiles, newProfile]
  }

  const { data: monthlyIncomes } = await supabase
    .from('monthly_incomes')
    .select('*')
    .eq('month', month)
    .eq('year', year)

  // 3. Fetch Budget Data
  const { data: categoriesData } = await supabase.from('budget_categories').select('*').eq('is_active', true).order('sort_order')
  const { data: budgetsData } = await supabase.from('monthly_budgets').select('*').eq('month', month).eq('year', year)

  const categories = (categoriesData as BudgetCategory[]) || []
  const budgets = (budgetsData as MonthlyBudget[]) || []

  // 4. Fetch Bank Data
  const { data: recentTransactions } = await supabase.from('bank_transactions').select('*').order('created_at', { ascending: false }).limit(5)
  const { data: matches } = await supabase.from('bill_transaction_matches').select(`
    id, confidence, match_reason, bill_id, bank_transaction_id,
    bill:bills(title, amount, date),
    transaction:bank_transactions(description, amount, transaction_date)
  `).is('approved_at', null).is('ignored_at', null)

  const unpaidBills = bills.filter(b => !b.is_paid)
  const paidBills = bills.filter(b => b.is_paid)
  const dueSoon = unpaidBills.filter(b => {
    const due = new Date(b.date).getTime()
    const today = new Date().getTime()
    return due - today < 7 * 24 * 60 * 60 * 1000
  })
  const unpaidAutogiro = unpaidBills.filter(b => b.payment_method === 'Autogiro')

  // Budget calculations
  const budgetStatus = categories.map(cat => {
    const budget = budgets.find(b => b.category_id === cat.id)?.budget_amount || 0
    const spent = bills.filter(b => b.category_id === cat.id).reduce((sum, b) => sum + b.amount, 0)
    return { ...cat, budget, spent, remaining: budget - spent }
  }).sort((a, b) => b.budget - a.budget)

  const overBudget = budgetStatus.filter(b => b.remaining < 0)

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-32 space-y-8 px-4 sm:px-6 max-w-2xl mx-auto">
      {/* 1. Månadsväljare */}
      <header className="pt-10 flex items-center justify-between">
        <MonthSwitcher currentMonth={month} currentYear={year} />
        <div className="flex gap-2">
          <AutomationButton month={month} year={year} />
          <AddBillModal userId={user.id} />
        </div>
      </header>

      {/* 2. Snabbsammanfattning */}
      <StatsCards 
        bills={bills as Bill[] || []} 
        monthlyIncomes={monthlyIncomes as MonthlyIncome[] || []} 
        profiles={profiles}
      />

      {/* 3. Viktiga varningar */}
      {(dueSoon.length > 0 || unpaidAutogiro.length > 0 || overBudget.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Viktiga varningar</h2>
          <div className="space-y-2">
            {dueSoon.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500">
                <Clock className="animate-pulse" size={18} />
                <span className="text-sm font-bold">{dueSoon.length} räkningar förfaller snart</span>
              </div>
            )}
            {unpaidAutogiro.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-center gap-3 text-blue-500">
                <Repeat size={18} />
                <span className="text-sm font-bold">{unpaidAutogiro.length} autogiro förväntas dras</span>
              </div>
            )}
            {overBudget.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex items-center gap-3 text-orange-500">
                <AlertCircle size={18} />
                <span className="text-sm font-bold">{overBudget.length} kategorier över budget</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bank Matchningar */}
      {matches && matches.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest px-1">Bankmatchningar hittade</h2>
          <TransactionMatches matches={matches as any} />
        </section>
      )}

      {/* 4. Obetalda räkningar */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Obetalda räkningar</h2>
          <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded-full text-gray-400">{unpaidBills.length}</span>
        </div>
        <BillList bills={unpaidBills as Bill[]} />
      </section>

      {/* 5. Budget denna månad */}
      <section className="space-y-4 bg-[#1a1a1a]/50 border border-white/5 p-6 rounded-[2.5rem]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">Budget</h2>
          <Link href="/dashboard/settings/banking" className="text-xs font-bold text-indigo-400 flex items-center gap-1">
            Hantera <ArrowRight size={14} />
          </Link>
        </div>
        <div className="space-y-5">
          {budgetStatus.slice(0, 5).map(cat => (
            <div key={cat.id} className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-300">{cat.name}</span>
                <span className={cat.remaining < 0 ? 'text-red-500' : 'text-gray-500'}>
                  {cat.spent.toLocaleString()} / {cat.budget.toLocaleString()} kr
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${cat.remaining < 0 ? 'bg-red-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(100, (cat.spent / (cat.budget || 1)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Betalda räkningar */}
      {paidBills.length > 0 && (
        <section className="space-y-4 opacity-60">
          <details className="group">
            <summary className="list-none flex items-center justify-between px-1 cursor-pointer">
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Betalda räkningar</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded-full text-gray-400">{paidBills.length}</span>
                <ChevronDown size={14} className="text-gray-600 group-open:rotate-180 transition-transform" />
              </div>
            </summary>
            <div className="pt-4">
              <BillList bills={paidBills as Bill[]} />
            </div>
          </details>
        </section>
      )}

      {/* Settings / Incomes */}
      <section className="space-y-6 pt-10 border-t border-white/5">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-1 text-center">Inställningar</h2>
        <SalarySettings 
          profiles={profiles as Profile[] || []} 
          initialIncomes={monthlyIncomes as MonthlyIncome[] || []}
          currentUserId={user.id}
          selectedMonth={month}
          selectedYear={year}
        />
      </section>

      {/* Recent Bank Confirm */}
      {recentTransactions && recentTransactions.length > 0 && (
        <section className="pt-10 border-t border-white/5 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-center mb-4">Bankhistorik</h2>
          <div className="max-w-md mx-auto space-y-1">
            {recentTransactions.map((tx: any) => (
              <div key={tx.id} className="flex justify-between items-center text-[10px] px-2">
                <span className="text-gray-400 truncate max-w-[120px]">{tx.description}</span>
                <span className="text-gray-600 font-mono">{tx.amount.toLocaleString()} kr</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

// Inline component for the Automation button until I create a separate file
function Clock(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  )
}
