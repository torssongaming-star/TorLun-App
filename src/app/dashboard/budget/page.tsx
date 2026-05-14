import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { BudgetCategory, MonthlyBudget } from '@/types/database'
import BudgetClient from './BudgetClient'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props {
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function BudgetPage({ searchParams }: Props) {
  const { month: spMonth, year: spYear } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const now = new Date()
  const month = parseInt(spMonth || (now.getMonth() + 1).toString())
  const year = parseInt(spYear || now.getFullYear().toString())

  // Fetch categories and budgets
  const { data: categories } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  const { data: budgets } = await supabase
    .from('monthly_budgets')
    .select('*')
    .eq('month', month)
    .eq('year', year)

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-32 space-y-8 px-4 sm:px-6 max-w-lg mx-auto pt-10">
      <header className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
          <ChevronLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Budgetering</h1>
          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
            {new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1))}
          </p>
        </div>
      </header>

      <BudgetClient 
        categories={categories as BudgetCategory[] || []} 
        initialBudgets={budgets as MonthlyBudget[] || []}
        month={month}
        year={year}
      />
    </main>
  )
}
