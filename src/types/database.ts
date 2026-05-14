export type Profile = {
  id: string
  email: string
  display_name: string | null
  monthly_salary: number
  updated_at: string
}

export type BillOwner = 'emil' | 'partner' | 'shared'
export type SplitType = '50/50' | 'percentage' | 'full'
export type Payer = 'emil' | 'partner'
export type PaymentMethod = 'Autogiro' | 'E-faktura' | 'Bankgiro' | 'Kortbetalning' | 'Swish' | 'Manuell betalning' | 'Annat'

export type BudgetCategory = {
  id: string
  name: string
  icon_name: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export type MonthlyBudget = {
  id: string
  category_id: string
  month: number
  year: number
  budget_amount: number
  created_at: string
  updated_at: string
}

export type Bill = {
  id: string
  created_at: string
  created_by: string
  title: string
  amount: number
  date: string
  is_paid: boolean
  owner: BillOwner
  split_type: SplitType
  split_value: number | null
  paid_by: Payer
  category?: string
  category_id: string | null
  paid_at?: string | null
  paid_by_user_id?: string | null
  notes?: string
  
  // Recurring and Payment fields
  payment_method: PaymentMethod
  is_recurring: boolean
  recurring_interval: 'monthly' | 'quarterly' | 'yearly'
  auto_create_next_month: boolean
  bankgiro_number?: string
  ocr_number?: string
  supplier_name?: string
  expected_amount?: number
  actual_amount?: number

  // Joined data
  budget_category?: BudgetCategory
}

export type MonthlyIncome = {
  id: string
  profile_id: string
  month: number
  year: number
  amount: number
}

export type Balance = {
  emilOwes: number
  partnerOwes: number
  net: number // positive means partner owes emil, negative means emil owes partner
}
