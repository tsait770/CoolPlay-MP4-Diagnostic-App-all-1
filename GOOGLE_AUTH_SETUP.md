# Google 登入 + 裝置識別設置指南

## 已完成的開發工作

### 1. 安裝的套件
- `expo-auth-session` - 處理 OAuth 認證流程
- `expo-crypto` - 加密和安全相關功能
- `expo-web-browser` - 在 app 內打開瀏覽器進行 OAuth

### 2. 新增的檔案
- `utils/deviceId.ts` - 裝置識別碼生成和管理
  - 使用平台特定的 ID (iOS: identifierForVendor, Android: androidId)
  - 自動儲存到 AsyncStorage
  - 提供 fallback 機制

### 3. 更新的檔案

#### `providers/AuthProvider.tsx`
新增功能：
- `signInWithGoogle()` - Google OAuth 登入
- `bindDeviceToUser()` - 綁定裝置到用戶
- 支援 web 和 mobile 平台的 Google 登入流程
- 自動裝置識別和綁定

#### `app/auth/sign-in.tsx`
- 新增 Google 登入按鈕
- 整合 `signInWithGoogle` 功能

#### `app/auth/sign-up.tsx`
- 新增 Google 註冊按鈕
- 整合 `signInWithGoogle` 功能

## Supabase 配置步驟

### 步驟 1: 啟用 Google OAuth Provider

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 進入 **Authentication** > **Providers**
4. 找到 **Google** provider 並點擊設置

### 步驟 2: 創建 Google OAuth Credentials

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新專案或選擇現有專案
3. 啟用 **Google+ API**
4. 進入 **APIs & Services** > **Credentials**
5. 點擊 **Create Credentials** > **OAuth 2.0 Client ID**

#### Web 應用配置
- Application type: **Web application**
- Authorized redirect URIs:
  ```
  https://djahnunbkbrfetktossw.supabase.co/auth/v1/callback
  ```

#### iOS 應用配置（如果需要）
- Application type: **iOS**
- Bundle ID: `app.rork.coolplay-voice-control-responsive-design-tnpfahko-1nujg3mu`

#### Android 應用配置（如果需要）
- Application type: **Android**
- Package name: `app.rork.coolplay_voice_control_responsive_design_tnpfahko_1nujg3mu`

### 步驟 3: 配置 Supabase

1. 返回 Supabase Dashboard > Authentication > Providers > Google
2. 填入從 Google Cloud Console 獲得的資訊：
   - **Client ID**: 你的 Google OAuth Client ID
   - **Client Secret**: 你的 Google OAuth Client Secret
3. 啟用 **Enabled** 開關
4. 點擊 **Save**

### 步驟 4: 更新 app.json（已完成）

URL Scheme 已設置為：
```json
"scheme": "myapp"
```

如果需要，可以改為更具體的：
```json
"scheme": "com.rork.instaplay"
```

## 資料庫表確認

確保 Supabase 中已有以下表：

### `bound_devices` 表
```sql
CREATE TABLE IF NOT EXISTS bound_devices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bound_devices_user_id ON bound_devices(user_id);
CREATE INDEX idx_bound_devices_device_id ON bound_devices(device_id);
```

### `profiles` 表
確保 profiles 表在用戶 Google 登入時能自動創建。可以使用觸發器：

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, membership_tier)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    'free'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 測試步驟

### 1. 啟動開發伺服器
```bash
npx expo start
```

### 2. 測試 Google 登入流程

#### Web 測試
1. 在瀏覽器中打開應用
2. 導航到登入頁面
3. 點擊 "使用 Google 登入" 按鈕
4. 完成 Google 授權流程
5. 確認自動跳轉回應用並登入成功

#### Mobile 測試（iOS/Android）
1. 使用 Expo Go 或開發構建掃描 QR code
2. 導航到登入頁面
3. 點擊 "使用 Google 登入" 按鈕
4. 應用內瀏覽器會打開 Google 登入頁面
5. 完成授權後自動返回應用
6. 確認登入成功並裝置已綁定

### 3. 驗證裝置綁定

登入成功後，檢查 Supabase 的 `bound_devices` 表，應該能看到：
- user_id: 登入用戶的 ID
- device_id: 裝置的唯一識別碼
- device_name: 裝置名稱
- last_login: 最後登入時間

## 常見問題排查

### 問題 1: Google 登入失敗
**解決方案**:
- 確認 Google Cloud Console 中的 redirect URI 正確
- 檢查 Supabase 中的 Google provider 已啟用
- 確認 Client ID 和 Secret 正確

### 問題 2: 裝置識別碼無法生成
**解決方案**:
- 檢查 expo-application 是否正確安裝
- 查看控制台日誌的錯誤訊息
- 系統會自動使用 fallback 生成隨機 ID

### 問題 3: 裝置綁定失敗
**解決方案**:
- 確認 bound_devices 表存在
- 檢查表的權限設置（RLS policies）
- 查看 AuthProvider 的控制台日誌

## 下一步

1. **配置 Google OAuth**
   - 完成上述 Supabase 配置步驟
   - 獲取並設置 Google Client ID 和 Secret

2. **測試**
   - 在 web 和 mobile 平台測試 Google 登入
   - 驗證裝置自動綁定功能

3. **可選增強功能**
   - 添加裝置管理頁面（查看/移除已綁定裝置）
   - 實現裝置限制邏輯（例如最多 3 個裝置）
   - 添加裝置驗證流程

## 使用說明

用戶現在可以：
1. 點擊 "使用 Google 登入/註冊" 按鈕
2. 授權 Google 帳號
3. 自動完成註冊並綁定當前裝置
4. 在其他裝置登入時，每個裝置都會自動綁定

裝置識別碼會：
- 在首次使用時自動生成
- 儲存在裝置本地（AsyncStorage）
- 在每次 Google 登入時自動綁定到用戶帳號
