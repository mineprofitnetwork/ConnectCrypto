-- Users Table (Handles Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- Optional, only if not using Supabase Auth exclusively
  role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'trader', 'agent', 'client')),
  full_name TEXT,
  balance NUMERIC(20, 2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  purged_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  referral_code TEXT,
  agent_id UUID REFERENCES auth.users(id),
  trader_id UUID REFERENCES auth.users(id),
  referral_commission NUMERIC(5, 2) DEFAULT 0.00,
  wallet_address_trc20 TEXT,
  wallet_address_bep20 TEXT,
  wallet_address_erc20 TEXT,
  wallet_qr_trc20 TEXT,
  wallet_qr_bep20 TEXT,
  wallet_qr_erc20 TEXT,
  aadhar_number TEXT,
  pan_number TEXT,
  kyc_status TEXT DEFAULT 'None' CHECK (kyc_status IN ('None', 'Pending', 'Verified', 'Rejected')),
  kyc_submitted_at TIMESTAMPTZ
);

-- Trader Buy Offers (Market Positions)
CREATE TABLE IF NOT EXISTS public.trader_buy_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trader_id UUID REFERENCES auth.users(id) NOT NULL,
  trader_username TEXT,
  display_name TEXT,
  crypto_asset_id TEXT NOT NULL,
  fiat_currency TEXT DEFAULT 'INR',
  fixed_price_per_crypto NUMERIC(20, 2) NOT NULL,
  network TEXT, -- CSV list or specific network
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Completed')),
  description TEXT,
  icon_cid TEXT,
  wallet_address_trc20 TEXT,
  wallet_address_bep20 TEXT,
  wallet_address_erc20 TEXT,
  wallet_qr_trc20 TEXT,
  wallet_qr_bep20 TEXT,
  wallet_qr_erc20 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade Transactions
CREATE TABLE IF NOT EXISTS public.trade_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) NOT NULL,
  client_username TEXT,
  agent_id UUID REFERENCES auth.users(id),
  agent_username TEXT,
  trader_id UUID REFERENCES auth.users(id) NOT NULL,
  trader_username TEXT,
  crypto_asset_id TEXT NOT NULL,
  crypto_amount NUMERIC(20, 8) NOT NULL,
  fiat_amount NUMERIC(20, 2) NOT NULL,
  bonus_amount NUMERIC(20, 2) DEFAULT 0.00,
  fiat_currency TEXT DEFAULT 'INR',
  network TEXT,
  status TEXT DEFAULT 'Paid' CHECK (status IN ('Paid', 'Success', 'Hold', 'KYC Required', 'Cancelled')),
  tx_hash TEXT,
  trader_wallet_address TEXT,
  is_rerouted BOOLEAN DEFAULT FALSE,
  is_bonus_applied BOOLEAN DEFAULT FALSE,
  initiation_time TIMESTAMPTZ DEFAULT NOW()
);

-- Withdrawal Requests
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  username TEXT,
  trader_id UUID REFERENCES auth.users(id),
  trader_name TEXT,
  amount NUMERIC(20, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  gateway_id TEXT,
  gateway_details JSONB,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Success', 'Hold', 'Verification Required', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Fiat Payment Methods (Gateways)
CREATE TABLE IF NOT EXISTS public.fiat_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  method_type TEXT CHECK (method_type IN ('UPI', 'BANK')),
  account_holder_name TEXT,
  upi_id TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_swift_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global Settings (Branding & Rerouting)
CREATE TABLE IF NOT EXISTS public.global_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  branding JSONB DEFAULT '{"selectedLogo": "gold"}'::JSONB,
  global_gateway JSONB DEFAULT '{"isReroutingEnabled": false}'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default global settings if not exists
INSERT INTO public.global_settings (id, branding, global_gateway)
VALUES ('default', '{"selectedLogo": "gold"}', '{"isReroutingEnabled": false}')
ON CONFLICT (id) DO NOTHING;

-- Profile Trigger: Automatically create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS (Row Level Security) - Basic Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trader_buy_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiat_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- NON-RECURSIVE PROFILE POLICIES
-- To avoid "infinite recursion" (42P17), never query 'public.profiles' inside a policy for 'public.profiles'
-- unless using a SECURITY DEFINER function.

-- 1. Users can always view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- 2. Traders can view profiles assigned to them
DROP POLICY IF EXISTS "Traders can view assigned profiles" ON public.profiles;
CREATE POLICY "Traders can view assigned profiles" ON public.profiles 
FOR SELECT USING (auth.uid() = trader_id);

-- 3. Agents can view profiles assigned to them
DROP POLICY IF EXISTS "Agents can view assigned profiles" ON public.profiles;
CREATE POLICY "Agents can view assigned profiles" ON public.profiles 
FOR SELECT USING (auth.uid() = agent_id);

-- 4. Admin Policy (Using a non-recursive check)
-- Note: In a production environment, it's better to use custom JWT claims for roles.
-- For now, we allow the specific admin email or id if known, or use a security definer function.
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles 
FOR SELECT USING (public.is_admin());

-- Allow public reading of offers
DROP POLICY IF EXISTS "Public can view offers" ON public.trader_buy_offers;
CREATE POLICY "Public can view offers" ON public.trader_buy_offers FOR SELECT USING (true);

-- Allow users to view their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.trade_transactions;
CREATE POLICY "Users can view own transactions" ON public.trade_transactions FOR SELECT USING (auth.uid() = client_id OR auth.uid() = trader_id OR auth.uid() = agent_id);

-- Allow users to view their own withdrawals
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id OR auth.uid() = trader_id);

-- Allow users to view their own payment methods
DROP POLICY IF EXISTS "Users can view own payment methods" ON public.fiat_payment_methods;
CREATE POLICY "Users can view own payment methods" ON public.fiat_payment_methods FOR SELECT USING (auth.uid() = user_id);

-- Allow public viewing of branding
DROP POLICY IF EXISTS "Public can view global settings" ON public.global_settings;
CREATE POLICY "Public can view global settings" ON public.global_settings FOR SELECT USING (true);
