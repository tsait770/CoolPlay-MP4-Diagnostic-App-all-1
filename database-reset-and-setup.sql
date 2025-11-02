-- =====================================================
-- InstaPlay V7 數據庫完整重置與創建腳本
-- 清理現有結構並重新創建所有表和函數
-- =====================================================
-- 警告：此腳本會刪除所有現有數據！
-- 僅在開發環境或需要完全重置時使用
-- =====================================================

-- =====================================================
-- 第一步：清理現有結構
-- =====================================================

-- 刪除所有觸發器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_updated_at ON public.subscriptions;
DROP TRIGGER IF EXISTS set_updated_at ON public.folders;
DROP TRIGGER IF EXISTS set_updated_at ON public.bookmarks;
DROP TRIGGER IF EXISTS set_updated_at ON public.bound_devices;
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_folders_updated_at ON public.folders;
DROP TRIGGER IF EXISTS update_bookmarks_updated_at ON public.bookmarks;
DROP TRIGGER IF EXISTS update_device_verifications_updated_at ON public.device_verifications;
DROP TRIGGER IF EXISTS update_user_devices_updated_at ON public.user_devices;

-- 刪除所有函數
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS reset_daily_quota() CASCADE;
DROP FUNCTION IF EXISTS check_usage_quota(UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_usage(UUID) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_verifications() CASCADE;

-- 按依賴順序刪除所有表
DROP TABLE IF EXISTS public.usage_logs CASCADE;
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.folders CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.device_verifications CASCADE;
DROP TABLE IF EXISTS public.user_devices CASCADE;
DROP TABLE IF EXISTS public.bound_devices CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =====================================================
-- 第二步：啟用必要的擴展
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 第三步：創建表結構
-- =====================================================

-- 1. PROFILES TABLE (用戶檔案)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  -- 會員資訊
  membership_tier TEXT NOT NULL DEFAULT 'free_trial' CHECK (membership_tier IN ('free_trial', 'free', 'basic', 'premium')),
  membership_started_at TIMESTAMPTZ DEFAULT NOW(),
  membership_expires_at TIMESTAMPTZ,
  
  -- Stripe 整合
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  
  -- 使用配額
  trial_used BOOLEAN DEFAULT FALSE,
  free_trial_remaining INTEGER DEFAULT 2000,
  daily_free_quota INTEGER DEFAULT 30,
  monthly_usage_remaining INTEGER DEFAULT 0,
  monthly_basic_quota INTEGER DEFAULT 1500,
  daily_basic_bonus INTEGER DEFAULT 40,
  daily_usage_count INTEGER DEFAULT 0,
  total_usage_count INTEGER DEFAULT 0,
  last_daily_reset_at TIMESTAMPTZ DEFAULT NOW(),
  last_monthly_reset_at TIMESTAMPTZ DEFAULT NOW(),
  last_reset_date DATE DEFAULT CURRENT_DATE,
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

-- 2. FOLDERS TABLE (資料夾)
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  
  -- 資料夾資訊
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT,
  category_id TEXT,
  
  -- 排序與層級
  sort_order INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(user_id, parent_id, name)
);

-- 3. BOOKMARKS TABLE (書籤)
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  
  -- 書籤資訊
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  favicon_url TEXT,
  favicon TEXT,
  favorite BOOLEAN DEFAULT FALSE,
  
  -- 視頻資訊
  video_type TEXT,
  video_source TEXT,
  duration INTEGER,
  is_adult_content BOOLEAN DEFAULT FALSE,
  
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

-- 4. BOUND_DEVICES TABLE (已綁定設備)
CREATE TABLE public.bound_devices (
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
  last_login TIMESTAMPTZ DEFAULT NOW(),
  last_ip_address INET,
  
  -- 元數據
  bound_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, device_id)
);

-- 5. DEVICE_VERIFICATIONS TABLE (設備驗證)
CREATE TABLE public.device_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- 驗證碼
  verification_code TEXT NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  
  -- 狀態
  is_used BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- 元數據
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  
  UNIQUE(verification_code)
);

-- 6. USAGE_LOGS TABLE (使用記錄)
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- 使用資訊
  action_type TEXT NOT NULL CHECK (action_type IN ('voice_command', 'video_play', 'bookmark_add', 'bookmark_delete', 'folder_create', 'folder_delete')),
  quota_used INTEGER DEFAULT 1,
  
  -- 視頻相關
  video_url TEXT,
  video_source TEXT,
  is_adult_content BOOLEAN DEFAULT FALSE,
  
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

-- 7. SUBSCRIPTIONS TABLE (訂閱 - PayPal & Stripe)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- PayPal 訂閱詳情
  paypal_subscription_id TEXT UNIQUE,
  paypal_plan_id TEXT,
  paypal_order_id TEXT,
  
  -- Stripe 訂閱詳情
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  
  -- 訂閱資訊
  plan_name TEXT NOT NULL CHECK (plan_name IN ('basic', 'premium')),
  billing_cycle TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('paypal', 'stripe')),
  
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

-- =====================================================
-- 第四步：啟用 Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bound_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 第五步：創建 RLS 策略
-- =====================================================

-- Profiles 策略
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Folders 策略
CREATE POLICY "Users can manage own folders" ON public.folders
  FOR ALL USING (auth.uid() = user_id);

-- Bookmarks 策略
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- Bound Devices 策略
CREATE POLICY "Users can view own devices" ON public.bound_devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices" ON public.bound_devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices" ON public.bound_devices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices" ON public.bound_devices
  FOR DELETE USING (auth.uid() = user_id);

-- Device Verifications 策略
CREATE POLICY "Users can view own verifications" ON public.device_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verifications" ON public.device_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verifications" ON public.device_verifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own verifications" ON public.device_verifications
  FOR DELETE USING (auth.uid() = user_id);

-- Usage Logs 策略
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions 策略
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 第六步：創建索引
-- =====================================================

-- Profiles 索引
CREATE INDEX idx_profiles_membership_tier ON public.profiles(membership_tier);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- Folders 索引
CREATE INDEX idx_folders_user_id ON public.folders(user_id);
CREATE INDEX idx_folders_parent_id ON public.folders(parent_id);

-- Bookmarks 索引
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_folder_id ON public.bookmarks(folder_id);
CREATE INDEX idx_bookmarks_created_at ON public.bookmarks(created_at);
CREATE INDEX idx_bookmarks_favorite ON public.bookmarks(user_id, favorite) WHERE favorite = TRUE;
CREATE INDEX idx_bookmarks_url ON public.bookmarks(url);

-- Bound Devices 索引
CREATE INDEX idx_bound_devices_user_id ON public.bound_devices(user_id);
CREATE INDEX idx_bound_devices_device_id ON public.bound_devices(device_id);

-- Device Verifications 索引
CREATE INDEX idx_device_verifications_user_id ON public.device_verifications(user_id);
CREATE INDEX idx_device_verifications_device_id ON public.device_verifications(device_id);
CREATE INDEX idx_device_verifications_code ON public.device_verifications(verification_code);
CREATE INDEX idx_device_verifications_expires_at ON public.device_verifications(expires_at);

-- Usage Logs 索引
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX idx_usage_logs_action_type ON public.usage_logs(action_type);

-- Subscriptions 索引
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_paypal_id ON public.subscriptions(paypal_subscription_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

-- =====================================================
-- 第七步：創建函數
-- =====================================================

-- 函數：自動更新 updated_at 時間戳
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 函數：自動創建用戶檔案
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

-- 函數：重置每日配額
CREATE OR REPLACE FUNCTION public.reset_daily_quota()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET daily_usage_count = 0,
      last_reset_date = CURRENT_DATE,
      last_daily_reset_at = NOW()
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 函數：檢查使用配額
CREATE OR REPLACE FUNCTION public.check_usage_quota(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_profile RECORD;
  v_can_use BOOLEAN;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  
  IF v_profile.last_reset_date < CURRENT_DATE THEN
    UPDATE public.profiles
    SET daily_usage_count = 0,
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
      v_can_use := v_profile.monthly_usage_remaining > 0 OR v_profile.daily_usage_count < v_profile.daily_basic_bonus;
    WHEN 'premium' THEN
      v_can_use := true;
    ELSE
      v_can_use := false;
  END CASE;
  
  RETURN v_can_use;
END;
$$ LANGUAGE plpgsql;

-- 函數：增加使用次數
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_profile RECORD;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  
  IF v_profile.last_reset_date < CURRENT_DATE THEN
    UPDATE public.profiles
    SET daily_usage_count = 1,
        total_usage_count = total_usage_count + 1,
        last_reset_date = CURRENT_DATE,
        last_daily_reset_at = NOW()
    WHERE id = p_user_id;
  ELSE
    UPDATE public.profiles
    SET daily_usage_count = daily_usage_count + 1,
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
        SET membership_tier = 'free',
            trial_used = true
        WHERE id = p_user_id;
      END IF;
    WHEN 'basic' THEN
      UPDATE public.profiles
      SET monthly_usage_remaining = GREATEST(0, monthly_usage_remaining - 1)
      WHERE id = p_user_id;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 函數：清理過期的驗證碼
CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.device_verifications
  WHERE expires_at < NOW() AND verified = FALSE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 第八步：創建觸發器
-- =====================================================

-- 觸發器：新用戶自動創建檔案
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 觸發器：自動更新 updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.bound_devices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.device_verifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 完成！數據庫已重置並重新創建
-- =====================================================

-- 執行完成後，請驗證：
-- 1. SELECT * FROM public.profiles; (應該為空)
-- 2. SELECT * FROM public.folders; (應該為空)
-- 3. SELECT * FROM public.bookmarks; (應該為空)
-- 4. SELECT * FROM public.bound_devices; (應該為空)
-- 5. SELECT * FROM public.usage_logs; (應該為空)
-- 6. SELECT * FROM public.subscriptions; (應該為空)
-- 7. SELECT * FROM public.device_verifications; (應該為空)

-- 現在可以註冊新用戶進行測試！
