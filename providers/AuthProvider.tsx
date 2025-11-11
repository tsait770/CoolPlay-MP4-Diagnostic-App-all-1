import { useState, useEffect, useCallback, useMemo } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { getDeviceInfo } from '@/utils/deviceId';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  membership_tier: 'free' | 'premium' | 'pro';
  membership_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initializing, setInitializing] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setInitializing(false);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
    }
  }, [user, loadProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName || null,
          membership_tier: 'free',
        });
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error: error as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error: error as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      console.log('開始 Google 登入流程...');
      const deviceInfo = await getDeviceInfo();
      console.log('裝置資訊:', deviceInfo);
      
      if (Platform.OS === 'web') {
        console.log('Web 平台 Google 登入');
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        
        if (error) throw error;
        return { data, error: null };
      } else {
        console.log('Mobile 平台 Google 登入');
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: 'myapp',
          path: 'auth/callback',
        });
        console.log('Redirect URL:', redirectUrl);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
          },
        });
        
        if (error) {
          console.error('Supabase OAuth 錯誤:', error);
          throw error;
        }
        
        console.log('OAuth URL 生成成功:', data?.url);
        
        if (data?.url) {
          console.log('開啟認證瀏覽器...');
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl,
            {
              showInRecents: true,
            }
          );
          
          console.log('認證結果:', result);
          
          if (result.type === 'success' && result.url) {
            console.log('認證成功，處理回調 URL...');
            const url = result.url;
            
            let params: URLSearchParams;
            if (url.includes('#')) {
              params = new URLSearchParams(url.split('#')[1]);
            } else if (url.includes('?')) {
              params = new URLSearchParams(url.split('?')[1]);
            } else {
              console.error('無法解析回調 URL');
              throw new Error('無法解析認證回調');
            }
            
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            console.log('Token 獲取成功:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });
            
            if (accessToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
              
              console.log('Session 設置成功');
              
              const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
              if (userError) {
                console.error('獲取用戶錯誤:', userError);
              } else if (currentUser) {
                console.log('用戶獲取成功:', currentUser.id);
                await bindDeviceToUser(currentUser.id, deviceInfo.deviceId, deviceInfo.deviceName);
                console.log('裝置綁定完成');
              }
              
              return { data, error: null };
            } else {
              console.error('未找到 access token');
              throw new Error('認證失敗：未獲取到訪問令牌');
            }
          } else if (result.type === 'cancel') {
            console.log('用戶取消認證');
            return { data: null, error: null };
          } else {
            console.error('認證失敗，類型:', result.type);
            throw new Error('Google 認證失敗');
          }
        } else {
          console.error('未生成 OAuth URL');
          throw new Error('無法生成認證 URL');
        }
      }
    } catch (error) {
      console.error('❌ Google 認證失敗:', error);
      let errorMessage = 'Google 登入失敗';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (typeof error === 'object' && error !== null) {
        try {
          errorMessage = JSON.stringify(error);
        } catch {
          errorMessage = String(error);
        }
      } else {
        errorMessage = String(error);
      }
      
      console.error('錯誤訊息:', errorMessage);
      return { data: null, error: { message: errorMessage, name: 'GoogleAuthError', status: 400 } as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);

  const bindDeviceToUser = async (userId: string, deviceId: string, deviceName: string) => {
    try {
      const { data: existingDevice } = await supabase
        .from('bound_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .single();
      
      if (!existingDevice) {
        await supabase.from('bound_devices').insert({
          user_id: userId,
          device_id: deviceId,
          device_name: deviceName,
          last_login: new Date().toISOString(),
        });
      } else {
        await supabase
          .from('bound_devices')
          .update({ last_login: new Date().toISOString() })
          .eq('id', existingDevice.id);
      }
    } catch (error) {
      console.error('Error binding device:', error);
    }
  };

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      await loadProfile();
      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  }, [user, loadProfile]);

  const isPremium = useMemo(() => {
    if (!profile) return false;
    if (profile.membership_tier === 'free') return false;
    if (!profile.membership_expires_at) return false;
    return new Date(profile.membership_expires_at) > new Date();
  }, [profile]);

  return useMemo(() => ({
    session,
    user,
    profile,
    loading,
    initializing,
    isPremium,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    loadProfile,
  }), [session, user, profile, loading, initializing, isPremium, signUp, signIn, signInWithGoogle, signOut, resetPassword, updateProfile, loadProfile]);
});
