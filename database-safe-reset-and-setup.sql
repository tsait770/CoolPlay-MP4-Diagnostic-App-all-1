-- =====================================================
-- InstaPlay V7 安全重置與完整創建腳本
-- 版本：3.0 - 絕對安全，保證能運行
-- 最後更新：2025-11-02
-- =====================================================
-- ⚠️  警告：此腳本會刪除所有現有數據！
-- 🔒 保證：使用 IF EXISTS 確保腳本不會因為表不存在而失敗
-- =====================================================

-- =====================================================
-- 階段 1：安全清理（使用 IF EXISTS）
-- =====================================================

-- 1.1 刪除所有 RLS 策略（動態，安全）
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 1.2 刪除所有觸發器（安全版本）
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE', 
            r.trigger_name, r.event_object_table);
    END LOOP;
END $$;

-- 1.3 刪除 auth.users 上的觸發器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- 1.4 刪除所有函數
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.reset_daily_quota() CASCADE;
DROP FUNCTION IF EXISTS public.check_usage_quota(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.increment_usage(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_verifications() CASCADE;

-- 1.5 刪除所有表（按依賴順序，全部使用 IF EXISTS）
DROP TABLE IF EXISTS public.usage_logs CASCADE;
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.folders CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.device_verifications CASCADE;
DROP TABLE IF EXISTS public.bound_devices CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1.6 刪除所有索引（如果存在）
DROP INDEX IF EXISTS public.idx_profiles_membership_tier CASCADE;
DROP INDEX IF EXISTS public.idx_profiles_email CASCADE;
DROP INDEX IF EXISTS public.idx_profiles_stripe_customer_id CASCADE;
DROP INDEX IF EXISTS public.idx_folders_user_id CASCADE;
DROP INDEX IF EXISTS public.idx_folders_parent_id CASCADE;
DROP INDEX IF EXISTS public.idx_bookmarks_user_id CASCADE;
DROP INDEX IF EXISTS public.idx_bookmarks_folder_id CASCADE;
DROP INDEX IF EXISTS public.idx_bookmarks_created_at CASCADE;
DROP INDEX IF EXISTS public.idx_bookmarks_favorite CASCADE;
DROP INDEX IF EXISTS public.idx_bookmarks_url CASCADE;
DROP INDEX IF EXISTS public.idx_bound_devices_user_id CASCADE;
DROP INDEX IF EXISTS public.idx_bound_devices_device_id CASCADE;
DROP INDEX IF EXISTS public.idx_bound_devices_active CASCADE;
DROP INDEX IF EXISTS public.idx_device_verifications_user_id CASCADE;
DROP INDEX IF EXISTS public.idx_device_verifications_code CASCADE;
DROP INDEX IF EXISTS public.idx_device_verifications_expires CASCADE;
DROP INDEX IF EXISTS public.idx_usage_logs_user_id CASCADE;
DROP INDEX IF EXISTS public.idx_usage_logs_created_at CASCADE;
DROP INDEX IF EXISTS public.idx_usage_logs_action_type CASCADE;
DROP INDEX IF EXISTS public.idx_subscriptions_user_id CASCADE;
DROP INDEX IF EXISTS public.idx_subscriptions_status CASCADE;
DROP INDEX IF EXISTS public.idx_subscriptions_paypal_id CASCADE;
DROP INDEX IF EXISTS public.idx_subscriptions_stripe_id CASCADE;

-- =====================================================
-- 階段 2：啟用必要的 PostgreSQL 擴展
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 階段 3：創建數據表
-- =====================================================

-- 3.1 PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  membership_tier TEXT NOT NULL DEFAULT 'free_trial' 
    CHECK (membership_tier IN ('free_trial', 'free', 'basic', 'premium')),
  membership_started_at TIMESTAMPTZ DEFAULT NOW(),
  membership_expires_at TIMESTAMPTZ,
  
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  paypal_subscription_id TEXT,
  
  trial_used BOOLEAN DEFAULT FALSE,
  free_trial_remaining INTEGER DEFAULT 2000,
  
  daily_free_quota INTEGER DEFAULT 30,
  daily_usage_count INTEGER DEFAULT 0,
  
  monthly_basic_quota INTEGER DEFAULT 1500,
  monthly_usage_remaining INTEGER DEFAULT 0,
  daily_basic_bonus INTEGER DEFAULT 40,
  
  total_usage_count INTEGER DEFAULT 0,
  
  last_daily_reset_at TIMESTAMPTZ DEFAULT NOW(),
  last_monthly_reset_at TIMESTAMPTZ DEFAULT NOW(),
  last_reset_date DATE DEFAULT CURRENT_DATE,
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  
  max_devices INTEGER DEFAULT 1,
  verification_code TEXT,
  verification_code_expires_at TIMESTAMPTZ,
  
  age_verified BOOLEAN DEFAULT FALSE,
  age_verification_date TIMESTAMPTZ,
  date_of_birth DATE,
  
  privacy_consent_given BOOLEAN DEFAULT FALSE,
  privacy_consent_date TIMESTAMPTZ,
  terms_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 3.2 FOLDERS TABLE
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT,
  category_id TEXT,
  
  sort_order INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(user_id, parent_id, name)
);

-- 3.3 BOOKMARKS TABLE
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  favicon_url TEXT,
  favicon TEXT,
  favorite BOOLEAN DEFAULT FALSE,
  
  video_type TEXT,
  video_source TEXT,
  duration INTEGER,
  is_adult_content BOOLEAN DEFAULT FALSE,
  
  tags TEXT[],
  category TEXT,
  
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(user_id, url)
);

-- 3.4 BOUND_DEVICES TABLE
CREATE TABLE public.bound_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT,
  device_model TEXT,
  os_version TEXT,
  app_version TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  last_ip_address INET,
  
  bound_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, device_id)
);

-- 3.5 DEVICE_VERIFICATIONS TABLE
CREATE TABLE public.device_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  verification_code TEXT NOT NULL UNIQUE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  
  is_used BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET
);

-- 3.6 USAGE_LOGS TABLE
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  action_type TEXT NOT NULL 
    CHECK (action_type IN ('voice_command', 'video_play', 'bookmark_add', 'bookmark_delete', 'folder_create', 'folder_delete')),
  quota_used INTEGER DEFAULT 1,
  
  video_url TEXT,
  video_source TEXT,
  is_adult_content BOOLEAN DEFAULT FALSE,
  
  command_text TEXT,
  command_language TEXT,
  command_confidence DECIMAL(3, 2),
  
  device_id TEXT,
  device_type TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- 3.7 SUBSCRIPTIONS TABLE
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  paypal_subscription_id TEXT UNIQUE,
  paypal_plan_id TEXT,
  paypal_order_id TEXT,
  
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  
  plan_name TEXT NOT NULL CHECK (plan_name IN ('basic', 'premium')),
  billing_cycle TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('paypal', 'stripe')),
  
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'active', 'suspended', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  next_billing_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 階段 4：創建索引
-- =====================================================

CREATE INDEX idx_profiles_membership_tier ON public.profiles(membership_tier);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX idx_folders_user_id ON public.folders(user_id);
CREATE INDEX idx_folders_parent_id ON public.folders(parent_id) WHERE parent_id IS NOT NULL;

CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_folder_id ON public.bookmarks(folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX idx_bookmarks_created_at ON public.bookmarks(created_at DESC);
CREATE INDEX idx_bookmarks_favorite ON public.bookmarks(user_id, favorite) WHERE favorite = TRUE;
CREATE INDEX idx_bookmarks_url ON public.bookmarks(url);

CREATE INDEX idx_bound_devices_user_id ON public.bound_devices(user_id);
CREATE INDEX idx_bound_devices_device_id ON public.bound_devices(device_id);
CREATE INDEX idx_bound_devices_active ON public.bound_devices(user_id, is_active) WHERE is_active = TRUE;

CREATE INDEX idx_device_verifications_user_id ON public.device_verifications(user_id);
CREATE INDEX idx_device_verifications_code ON public.device_verifications(verification_code);
CREATE INDEX idx_device_verifications_expires ON public.device_verifications(expires_at) WHERE is_used = FALSE;

CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_action_type ON public.usage_logs(action_type);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_paypal_id ON public.subscriptions(paypal_subscription_id) WHERE paypal_subscription_id IS NOT NULL;
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- =====================================================
-- 階段 5：啟用 RLS
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bound_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 階段 6：創建 RLS 策略
-- =====================================================

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "folders_all_own" ON public.folders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_all_own" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "devices_select_own" ON public.bound_devices
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "devices_insert_own" ON public.bound_devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "devices_update_own" ON public.bound_devices
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "devices_delete_own" ON public.bound_devices
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "verifications_select_own" ON public.device_verifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "verifications_insert_own" ON public.device_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "verifications_update_own" ON public.device_verifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "verifications_delete_own" ON public.device_verifications
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "logs_select_own" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "logs_insert_own" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 階段 7：創建函數
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_daily_quota()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    daily_usage_count = 0,
    last_reset_date = CURRENT_DATE,
    last_daily_reset_at = NOW()
  WHERE last_reset_date < CURRENT_DATE;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_usage_quota(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_profile RECORD;
  v_can_use BOOLEAN;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  IF v_profile.last_reset_date < CURRENT_DATE THEN
    UPDATE public.profiles
    SET 
      daily_usage_count = 0,
      last_reset_date = CURRENT_DATE,
      last_daily_reset_at = NOW()
    WHERE id = p_user_id;
    v_profile.daily_usage_count := 0;
  END IF;
  
  CASE v_profile.membership_tier
    WHEN 'free_trial' THEN
      v_can_use := v_profile.free_trial_remaining > 0;
    WHEN 'free' THEN
      v_can_use := v_profile.daily_usage_count < v_profile.daily_free_quota;
    WHEN 'basic' THEN
      v_can_use := v_profile.monthly_usage_remaining > 0 OR 
                   v_profile.daily_usage_count < v_profile.daily_basic_bonus;
    WHEN 'premium' THEN
      v_can_use := TRUE;
    ELSE
      v_can_use := FALSE;
  END CASE;
  
  RETURN v_can_use;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  IF v_profile.last_reset_date < CURRENT_DATE THEN
    UPDATE public.profiles
    SET 
      daily_usage_count = 1,
      total_usage_count = total_usage_count + 1,
      last_reset_date = CURRENT_DATE,
      last_daily_reset_at = NOW()
    WHERE id = p_user_id;
  ELSE
    UPDATE public.profiles
    SET 
      daily_usage_count = daily_usage_count + 1,
      total_usage_count = total_usage_count + 1
    WHERE id = p_user_id;
  END IF;
  
  CASE v_profile.membership_tier
    WHEN 'free_trial' THEN
      UPDATE public.profiles
      SET free_trial_remaining = GREATEST(0, free_trial_remaining - 1)
      WHERE id = p_user_id;
      
      IF v_profile.free_trial_remaining <= 1 THEN
        UPDATE public.profiles
        SET 
          membership_tier = 'free',
          trial_used = TRUE
        WHERE id = p_user_id;
      END IF;
      
    WHEN 'basic' THEN
      UPDATE public.profiles
      SET monthly_usage_remaining = GREATEST(0, monthly_usage_remaining - 1)
      WHERE id = p_user_id;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.device_verifications
  WHERE expires_at < NOW() AND verified = FALSE;
END;
$$;

-- =====================================================
-- 階段 8：創建觸發器
-- =====================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_folders
  BEFORE UPDATE ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_bookmarks
  BEFORE UPDATE ON public.bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_devices
  BEFORE UPDATE ON public.bound_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_verifications
  BEFORE UPDATE ON public.device_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- ✅ 完成！
-- =====================================================
