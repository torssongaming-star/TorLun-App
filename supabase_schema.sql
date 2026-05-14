-- [Tidigare tabeller: profiles, bills, recurring_bills, monthly_incomes...]

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  monthly_salary NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  owner TEXT CHECK (owner IN ('emil', 'partner', 'shared')) NOT NULL,
  split_type TEXT CHECK (split_type IN ('50/50', 'percentage', 'full')) NOT NULL,
  split_value NUMERIC,
  paid_by TEXT CHECK (paid_by IN ('emil', 'partner')) NOT NULL,
  category TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by_user_id UUID REFERENCES profiles(id),
  notes TEXT
);

-- Create bank_imports table
CREATE TABLE IF NOT EXISTS bank_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bank_name TEXT NOT NULL,
  file_name TEXT,
  file_hash TEXT UNIQUE -- To prevent duplicate file uploads
);

-- Create bank_transactions table
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bank_import_id UUID REFERENCES bank_imports(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  balance NUMERIC,
  currency TEXT DEFAULT 'SEK',
  raw_data JSONB,
  transaction_hash TEXT UNIQUE -- To prevent duplicate transactions
);

-- Create bill_transaction_matches table
CREATE TABLE IF NOT EXISTS bill_transaction_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE NOT NULL,
  bank_transaction_id UUID REFERENCES bank_transactions(id) ON DELETE CASCADE NOT NULL,
  confidence NUMERIC NOT NULL, -- 0-100
  match_reason TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by_user_id UUID REFERENCES profiles(id),
  ignored_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(bill_id, bank_transaction_id)
);

-- RLS Enable
ALTER TABLE bank_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_transaction_matches ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own imports" ON bank_imports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own transactions" ON bank_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage matches for their bills" ON bill_transaction_matches FOR ALL USING (
  EXISTS (
    SELECT 1 FROM bills WHERE bills.id = bill_id AND bills.created_by = auth.uid()
  )
);

-- [Trigger handle_new_user...]
