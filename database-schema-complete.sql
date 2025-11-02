-- =====================================================
-- InstaPlay V7 完整數據庫架構
-- 與應用程式代碼完全匹配的版本
-- =====================================================

-- 啟用必要的擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. PROFILES TABLE (用戶檔案 - 擴展 Supabase Auth)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  -- 會員資訊
  membership_tier TEXT NOT NULL DEFAULT 'free' CHECK (membership_tier IN ('free_trial', 'free', 'basic', 'premium')),
  membership_started_at TIMESTAMPTZ DEFAULT NOW(),
  membership_expires_at TIMESTAMPTZ,
  
  -- 使用配額
  free_trial_remaining INTEGER DEFAULT 2000,
  daily_free_quota INTEGER DEFAULT 30,
  monthly_usage_remaining INTEGER DEFAULT 0,
  monthly_basic_quota INTEGER DEFAULT 1500,
  daily_basic_bonus INTEGER DEFAULT 40,
  last_daily_reset_at TIMESTAMPTZ DEFAULT NOW(),
  last_monthly_reset_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 設備管理
  max_devices INTEGER DEFAULT 1,
  verification_code TEXT,
  verification_code_expires_at TIMESTAMPTZ,
  
  -- 年齡驗證 (成人內容)
  age_verified BOOLEAN DEFAULT FALSE,
  age_verification_date TIMESTAMPTZ,
  date_of_birth DATE,
  
  -- 隱私與同意
  privacy_consent_given BOOLEAN DEFAULT FALSE,
  privacy_consent_date TIMESTAMPTZ,
  terms_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted_date TIMESTAMPTZ,
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- RLS 策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. BOUND_DEVICES TABLE (已綁定設備)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bound_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- 設備識別
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT,
  device_model TEXT,
  os_version TEXT,
  app_version TEXT,
  
  -- 設備狀態
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  last_ip_address INET,
  
  -- 元數據
  bound_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, device_id)
);

-- RLS 策略
ALTER TABLE public.bound_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices" ON public.bound_devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices" ON public.bound_devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices" ON public.bound_devices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices" ON public.bound_devices
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 3. USAGE_LOGS TABLE (使用記錄)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- 使用資訊
  action_type TEXT NOT NULL CHECK (action_type IN ('voice_command', 'video_play', 'bookmark_add', 'bookmark_delete', 'folder_create', 'folder_delete')),
  quota_used INTEGER DEFAULT 1,
  
  -- 語音命令相關
  command_text TEXT,
  command_language TEXT,
  command_confidence DECIMAL(3, 2),
  
  -- 設備資訊
  device_id TEXT,
  device_type TEXT,
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- RLS 策略
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. BOOKMARKS TABLE (書籤)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  
  -- 書籤資訊
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  favicon_url TEXT,
  
  -- 視頻資訊
  video_type TEXT,
  duration INTEGER,
  
  -- 分類標籤
  tags TEXT[],
  category TEXT,
  
  -- 統計
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(user_id, url)
);

-- RLS 策略
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 5. FOLDERS TABLE (資料夾)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  
  -- 資料夾資訊
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  
  -- 排序與層級
  sort_order INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(user_id, parent_id, name)
);

-- RLS 策略
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own folders" ON public.folders
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 6. DEVICE_VERIFICATIONS TABLE (設備驗證)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.device_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- 驗證碼
  verification_code TEXT NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  
  -- 狀態
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  
  UNIQUE(verification_code)
);

-- RLS 策略
ALTER TABLE public.device_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications" ON public.device_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verifications" ON public.device_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. SUBSCRIPTIONS TABLE (訂閱 - PayPal 整合)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- PayPal 訂閱詳情
  paypal_subscription_id TEXT UNIQUE,
  paypal_plan_id TEXT NOT NULL,
  paypal_order_id TEXT,
  
  -- 訂閱資訊
  plan_name TEXT NOT NULL CHECK (plan_name IN ('basic', 'premium')),
  billing_cycle TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- 狀態追蹤
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  next_billing_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 策略
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 索引優化
-- =====================================================

-- Profiles 索引
CREATE INDEX IF NOT EXISTS idx_profiles_membership_tier ON public.profiles(membership_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Bound Devices 索引
CREATE INDEX IF NOT EXISTS idx_bound_devices_user_id ON public.bound_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_bound_devices_device_id ON public.bound_devices(device_id);

-- Usage Logs 索引
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action_type ON public.usage_logs(action_type);

-- Bookmarks 索引
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_folder_id ON public.bookmarks(folder_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at);

-- Folders 索引
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);

-- Device Verifications 索引
CREATE INDEX IF NOT EXISTS idx_device_verifications_user_id ON public.device_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_device_verifications_code ON public.device_verifications(verification_code);
CREATE INDEX IF NOT EXISTS idx_device_verifications_expires_at ON public.device_verifications(expires_at);

-- Subscriptions 索引
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id ON public.subscriptions(paypal_subscription_id);

-- =====================================================
-- 函數：自動創建用戶檔案
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 觸發器：當新用戶註冊時自動創建檔案
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 函數：更新 updated_at 時間戳
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為所有需要的表添加 updated_at 觸發器
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.bound_devices;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.bound_devices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.bookmarks;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.folders;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.subscriptions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 完成！
-- =====================================================
-- 請在 Supabase SQL Editor 中執行此文件
-- 執行步驟：
-- 1. 登入 Supabase Dashboard
-- 2. 選擇您的專案
-- 3. 進入 SQL Editor
-- 4. 貼上此 SQL 並執行
-- 5. 驗證所有表已成功創建
-- =====================================================
