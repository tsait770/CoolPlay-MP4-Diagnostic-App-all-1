-- Bitcoin Wallets Database Schema
-- This schema stores encrypted Bitcoin wallet keys with client-side encryption

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Wallets table: stores encrypted Bitcoin wallet data
CREATE TABLE IF NOT EXISTS public.bitcoin_wallets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  type text NOT NULL CHECK (type IN ('mnemonic', 'xprv', 'wif', 'private_key')),
  network text NOT NULL DEFAULT 'bitcoin-mainnet' CHECK (network IN ('bitcoin-mainnet', 'bitcoin-testnet')),
  
  -- Encrypted blob (AES-GCM encrypted on client)
  encrypted_blob text NOT NULL,
  
  -- Encryption metadata (algorithm, salt, iv, kdf params)
  encryption_meta jsonb NOT NULL,
  
  -- Derivation path for HD wallets
  derivation_path text,
  
  -- Public address (safe to store)
  address text,
  
  -- Backup hash for verification
  backup_hash text,
  
  -- Status flags
  is_active boolean DEFAULT false,
  is_backed_up boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  last_backup_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Wallet backups table: stores encrypted backup files
CREATE TABLE IF NOT EXISTS public.wallet_backups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Storage reference
  storage_path text NOT NULL,
  
  -- Backup metadata
  wallet_ids uuid[] NOT NULL,
  backup_hash text NOT NULL,
  file_size integer,
  
  -- Encryption metadata
  encryption_meta jsonb NOT NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- Wallet access logs: track when wallets are accessed
CREATE TABLE IF NOT EXISTS public.wallet_access_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wallet_id uuid REFERENCES public.bitcoin_wallets(id) ON DELETE CASCADE NOT NULL,
  
  action text NOT NULL CHECK (action IN ('view', 'export', 'backup', 'delete')),
  device_info jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bitcoin_wallets_user_id ON public.bitcoin_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_bitcoin_wallets_is_active ON public.bitcoin_wallets(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_wallet_backups_user_id ON public.wallet_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_access_logs_user_id ON public.wallet_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_access_logs_wallet_id ON public.wallet_access_logs(wallet_id);

-- Enable Row Level Security
ALTER TABLE public.bitcoin_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bitcoin_wallets
CREATE POLICY "Users can view their own wallets"
  ON public.bitcoin_wallets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets"
  ON public.bitcoin_wallets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets"
  ON public.bitcoin_wallets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets"
  ON public.bitcoin_wallets
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for wallet_backups
CREATE POLICY "Users can view their own backups"
  ON public.wallet_backups
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backups"
  ON public.wallet_backups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backups"
  ON public.wallet_backups
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for wallet_access_logs
CREATE POLICY "Users can view their own access logs"
  ON public.wallet_access_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own access logs"
  ON public.wallet_access_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bitcoin_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_bitcoin_wallets_updated_at
  BEFORE UPDATE ON public.bitcoin_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_bitcoin_wallet_updated_at();

-- Function to get wallet count for user
CREATE OR REPLACE FUNCTION get_user_wallet_count(p_user_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.bitcoin_wallets
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage bucket for encrypted backups
INSERT INTO storage.buckets (id, name, public)
VALUES ('wallet-backups', 'wallet-backups', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own wallet backups"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'wallet-backups' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own wallet backups"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'wallet-backups' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own wallet backups"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'wallet-backups' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
