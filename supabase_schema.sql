-- TorLund App - Master Database Schema

-- 1. Profiles (Users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  monthly_salary NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Budget Categories
CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon_name TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Monthly Budgets
CREATE TABLE IF NOT EXISTS monthly_budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES budget_categories(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  budget_amount NUMERIC DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, month, year)
);

-- 4. Bills
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
  category TEXT, -- Legacy string category
  category_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL, -- New linked category
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by_user_id UUID REFERENCES profiles(id),
  notes TEXT,
  
  -- Recurring and Payment fields
  payment_method TEXT DEFAULT 'Manuell betalning',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_interval TEXT DEFAULT 'monthly',
  auto_create_next_month BOOLEAN DEFAULT FALSE,
  bankgiro_number TEXT,
  ocr_number TEXT,
  supplier_name TEXT,
  expected_amount NUMERIC,
  actual_amount NUMERIC
);

-- 5. Bank Imports
CREATE TABLE IF NOT EXISTS bank_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bank_name TEXT NOT NULL,
  file_name TEXT,
  file_hash TEXT UNIQUE
);

-- 6. Bank Transactions
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
  transaction_hash TEXT UNIQUE
);

-- 7. Bill Transaction Matches
CREATE TABLE IF NOT EXISTS bill_transaction_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE NOT NULL,
  bank_transaction_id UUID REFERENCES bank_transactions(id) ON DELETE CASCADE NOT NULL,
  confidence NUMERIC NOT NULL,
  match_reason TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by_user_id UUID REFERENCES profiles(id),
  ignored_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(bill_id, bank_transaction_id)
);

-- 8. Monthly Incomes
CREATE TABLE IF NOT EXISTS monthly_incomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  amount NUMERIC DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, month, year)
);

-- RLS Enable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_transaction_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_incomes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view all budget categories" ON budget_categories FOR SELECT USING (true);
CREATE POLICY "Users can view all monthly budgets" ON monthly_budgets FOR SELECT USING (true);
CREATE POLICY "Users can manage monthly budgets" ON monthly_budgets FOR ALL USING (true); -- Private app, allow all

CREATE POLICY "Users can view all bills" ON bills FOR SELECT USING (true);
CREATE POLICY "Users can insert bills" ON bills FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own bills" ON bills FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own bills" ON bills FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can manage their own imports" ON bank_imports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own transactions" ON bank_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage matches for their bills" ON bill_transaction_matches FOR ALL USING (
  EXISTS (SELECT 1 FROM bills WHERE bills.id = bill_id AND bills.created_by = auth.uid())
);

CREATE POLICY "Users can view all monthly incomes" ON monthly_incomes FOR SELECT USING (true);
CREATE POLICY "Users can update their own monthly incomes" ON monthly_incomes FOR ALL USING (auth.uid() = profile_id);

-- Initial Categories
INSERT INTO budget_categories (name, icon_name, sort_order) VALUES
('Boende', 'Home', 1),
('Mat', 'Utensils', 2),
('Katter', 'Cat', 3),
('Försäkringar', 'Shield', 4),
('Lån', 'Banknote', 5),
('El', 'Zap', 6),
('Internet', 'Wifi', 7),
('Telefon', 'Smartphone', 8),
('Bil', 'Car', 9),
('Transport', 'Bus', 10),
('Abonnemang', 'CreditCard', 11),
('Sparande', 'PiggyBank', 12),
('Nöje', 'Gamepad2', 13),
('Hälsa', 'Heart', 14),
('Övrigt', 'MoreHorizontal', 15)
ON CONFLICT DO NOTHING;

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
