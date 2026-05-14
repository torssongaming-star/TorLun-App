-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  monthly_salary NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bills table
CREATE TABLE bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  owner TEXT CHECK (owner IN ('emil', 'partner', 'shared')) NOT NULL,
  split_type TEXT CHECK (split_type IN ('50/50', 'percentage', 'full')) NOT NULL,
  split_value NUMERIC, -- Only used for percentage
  paid_by TEXT CHECK (paid_by IN ('emil', 'partner')) NOT NULL,
  category TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by_user_id UUID REFERENCES profiles(id),
  notes TEXT
);

-- Create recurring_bills table
CREATE TABLE recurring_bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  owner TEXT CHECK (owner IN ('emil', 'partner', 'shared')) NOT NULL,
  split_type TEXT CHECK (split_type IN ('50/50', 'percentage', 'full')) NOT NULL,
  split_value NUMERIC,
  paid_by TEXT CHECK (paid_by IN ('emil', 'partner')) NOT NULL,
  category TEXT
);

-- Create monthly_incomes table
CREATE TABLE monthly_incomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  amount NUMERIC DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, month, year)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for bills
CREATE POLICY "Users can view all bills" ON bills FOR SELECT USING (true);
CREATE POLICY "Users can insert bills" ON bills FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own bills" ON bills FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own bills" ON bills FOR DELETE USING (auth.uid() = created_by);

-- Policies for recurring_bills
CREATE POLICY "Users can view all recurring bills" ON recurring_bills FOR SELECT USING (true);
CREATE POLICY "Users can insert recurring bills" ON recurring_bills FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own recurring bills" ON recurring_bills FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own recurring bills" ON recurring_bills FOR DELETE USING (auth.uid() = created_by);

-- Policies for monthly_incomes
ALTER TABLE monthly_incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all monthly incomes" ON monthly_incomes FOR SELECT USING (true);
CREATE POLICY "Users can update their own monthly incomes" ON monthly_incomes FOR ALL USING (auth.uid() = profile_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
