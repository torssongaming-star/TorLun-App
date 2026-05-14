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
  paid_at?: string
  paid_by_user_id?: string
  notes?: string
}

export type RecurringBill = {
  id: string
  created_at: string
  created_by: string
  title: string
  amount: number
  owner: BillOwner
  split_type: SplitType
  split_value: number | null
  paid_by: Payer
  category?: string
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
