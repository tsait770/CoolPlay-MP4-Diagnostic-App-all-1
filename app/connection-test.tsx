import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Chrome } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

type TestStatus = 'pending' | 'running' | 'success' | 'error';

interface TestResult {
  name: string;
  status: TestStatus;
  message: string;
  details?: string;
}

export default function ConnectionTestScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithGoogle, user } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([
    { name: '環境變數驗證', status: 'pending', message: '等待測試...' },
    { name: 'Supabase 連接測試', status: 'pending', message: '等待測試...' },
    { name: '數據庫表驗證', status: 'pending', message: '等待測試...' },
    { name: 'Google 認證測試', status: 'pending', message: '等待測試...' },
    { name: 'tRPC API 連接測試', status: 'pending', message: '等待測試...' },
    { name: '會員系統測試', status: 'pending', message: '等待測試...' },
    { name: '設備綁定測試', status: 'pending', message: '等待測試...' },
    { name: '語音配額測試', status: 'pending', message: '等待測試...' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [testingGoogle, setTestingGoogle] = useState(false);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);

    try {
      // 測試 1: 環境變數驗證
      updateTest(0, { status: 'running', message: '檢查中...' });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      const toolkitUrl = process.env.EXPO_PUBLIC_TOOLKIT_URL;
      const appUrl = process.env.EXPO_PUBLIC_APP_URL;

      if (!supabaseUrl || !supabaseKey) {
        updateTest(0, {
          status: 'error',
          message: '環境變數缺失',
          details: `Supabase URL: ${supabaseUrl ? '✓' : '✗'}\nSupabase Key: ${supabaseKey ? '✓' : '✗'}`,
        });
      } else {
        updateTest(0, {
          status: 'success',
          message: '環境變數正確配置',
          details: `Supabase URL: ✓\nSupabase Key: ✓\nApp URL: ${appUrl || '未設置'}\nToolkit URL: ${toolkitUrl || '未設置'}`,
        });
      }

      // 測試 2: Supabase 連接測試
      updateTest(1, { status: 'running', message: '連接中...' });
      try {
        const { error } = await supabase.from('profiles').select('count').limit(1);
        
        if (error) {
          updateTest(1, {
            status: 'error',
            message: 'Supabase 連接失敗',
            details: error.message,
          });
        } else {
          updateTest(1, {
            status: 'success',
            message: 'Supabase 連接成功',
            details: '成功連接到數據庫',
          });
        }
      } catch (error) {
        updateTest(1, {
          status: 'error',
          message: 'Supabase 連接異常',
          details: error instanceof Error ? error.message : String(error),
        });
      }

      // 測試 3: 數據庫表驗證
      updateTest(2, { status: 'running', message: '驗證中...' });
      try {
        const tables = [
          'profiles',
          'bookmarks',
          'folders',
          'device_verifications',
          'bound_devices',
          'usage_logs',
        ];

        const tableChecks = await Promise.all(
          tables.map(async (table) => {
            try {
              const { error } = await supabase.from(table).select('*').limit(1);
              return { table, exists: !error, error: error?.message };
            } catch {
              return { table, exists: false, error: '查詢失敗' };
            }
          })
        );

        const missingTables = tableChecks.filter(t => !t.exists);
        
        if (missingTables.length > 0) {
          updateTest(2, {
            status: 'error',
            message: `缺少 ${missingTables.length} 個表`,
            details: missingTables.map(t => `${t.table}: ${t.error}`).join('\n'),
          });
        } else {
          updateTest(2, {
            status: 'success',
            message: '所有表都已創建',
            details: `已驗證 ${tables.length} 個表`,
          });
        }
      } catch (error) {
        updateTest(2, {
          status: 'error',
          message: '表驗證失敗',
          details: error instanceof Error ? error.message : String(error),
        });
      }

      // 測試 4: Google 認證測試（不自動運行）
      updateTest(3, { 
        status: 'pending', 
        message: '請手動測試',
        details: '點擊下方按鈕測試 Google 登入功能'
      });

      // 測試 5: tRPC API 連接測試
      updateTest(4, { status: 'running', message: '測試中...' });
      try {
        const baseUrl = process.env.EXPO_PUBLIC_APP_URL || 'http://localhost:8081';
        const apiEndpoint = `${baseUrl}/api/trpc/example.hi`;
        
        console.log('Testing tRPC API at:', apiEndpoint);
        
        const result = await fetch(apiEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('tRPC API Response status:', result.status);
        
        if (result.ok) {
          await result.json();
          updateTest(4, {
            status: 'success',
            message: 'tRPC API 連接成功',
            details: `狀態碼: ${result.status}\nAPI URL: ${baseUrl}`,
          });
        } else {
          updateTest(4, {
            status: 'error',
            message: 'tRPC API 響應錯誤',
            details: `狀態碼: ${result.status}\nAPI URL: ${apiEndpoint}`,
          });
        }
      } catch (error) {
        updateTest(4, {
          status: 'error',
          message: 'tRPC API 連接失敗',
          details: `${error instanceof Error ? error.message : String(error)}\n請確認後端服務已啟動`,
        });
      }

      // 測試 6: 會員系統測試
      updateTest(5, { status: 'running', message: '測試中...' });
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session?.session) {
          updateTest(5, {
            status: 'error',
            message: '未登入',
            details: '需要先登入才能測試會員系統',
          });
        } else {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.session.user.id)
            .single();

          if (error) {
            updateTest(5, {
              status: 'error',
              message: '會員資料查詢失敗',
              details: error.message,
            });
          } else if (!profile) {
            updateTest(5, {
              status: 'error',
              message: '會員資料不存在',
              details: '請確認 profiles 表已正確初始化',
            });
          } else {
            updateTest(5, {
              status: 'success',
              message: '會員系統正常',
              details: `會員等級: ${profile.membership_tier}\n配額: ${profile.monthly_usage_remaining}`,
            });
          }
        }
      } catch (error) {
        updateTest(5, {
          status: 'error',
          message: '會員系統測試失敗',
          details: error instanceof Error ? error.message : String(error),
        });
      }

      // 測試 7: 設備綁定測試
      updateTest(6, { status: 'running', message: '測試中...' });
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session?.session) {
          updateTest(6, {
            status: 'error',
            message: '未登入',
            details: '需要先登入才能測試設備綁定',
          });
        } else {
          const { data: devices, error } = await supabase
            .from('bound_devices')
            .select('*')
            .eq('user_id', session.session.user.id);

          if (error) {
            updateTest(6, {
              status: 'error',
              message: '設備查詢失敗',
              details: error.message,
            });
          } else {
            updateTest(6, {
              status: 'success',
              message: '設備綁定系統正常',
              details: `已綁定設備數: ${devices?.length || 0}`,
            });
          }
        }
      } catch (error) {
        updateTest(6, {
          status: 'error',
          message: '設備綁定測試失敗',
          details: error instanceof Error ? error.message : String(error),
        });
      }

      // 測試 8: 語音配額測試
      updateTest(7, { status: 'running', message: '測試中...' });
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session?.session) {
          updateTest(7, {
            status: 'error',
            message: '未登入',
            details: '需要先登入才能測試語音配額',
          });
        } else {
          const { data: usageLogs, error } = await supabase
            .from('usage_logs')
            .select('*')
            .eq('user_id', session.session.user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) {
            updateTest(7, {
              status: 'error',
              message: '配額查詢失敗',
              details: error.message,
            });
          } else {
            updateTest(7, {
              status: 'success',
              message: '語音配額系統正常',
              details: `使用記錄數: ${usageLogs?.length || 0}`,
            });
          }
        }
      } catch (error) {
        updateTest(7, {
          status: 'error',
          message: '語音配額測試失敗',
          details: error instanceof Error ? error.message : String(error),
        });
      }

    } catch (error) {
      Alert.alert('測試失敗', error instanceof Error ? error.message : String(error));
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={24} color="#10b981" />;
      case 'error':
        return <XCircle size={24} color="#ef4444" />;
      case 'running':
        return <ActivityIndicator size="small" color="#3b82f6" />;
      default:
        return <AlertCircle size={24} color="#94a3b8" />;
    }
  };

  const getStatusColor = (status: TestStatus) => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'running':
        return '#3b82f6';
      default:
        return '#94a3b8';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: '連接測試',
          headerStyle: { backgroundColor: '#1e293b' },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>系統連接測試</Text>
          <Text style={styles.subtitle}>
            驗證環境變數、數據庫連接和核心功能
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.runButton, isRunning && styles.runButtonDisabled]}
          onPress={runTests}
          disabled={isRunning}
        >
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.runButtonText}>
            {isRunning ? '測試中...' : '開始測試'}
          </Text>
        </TouchableOpacity>

        <View style={styles.testsContainer}>
          {tests.map((test, index) => (
            <View key={index} style={styles.testCard}>
              <View style={styles.testHeader}>
                <View style={styles.testIcon}>
                  {getStatusIcon(test.status)}
                </View>
                <View style={styles.testInfo}>
                  <Text style={styles.testName}>{test.name}</Text>
                  <Text
                    style={[
                      styles.testMessage,
                      { color: getStatusColor(test.status) },
                    ]}
                  >
                    {test.message}
                  </Text>
                </View>
              </View>
              {test.details && (
                <View style={styles.testDetails}>
                  <Text style={styles.testDetailsText}>{test.details}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.googleTestContainer}>
          <Text style={styles.googleTestTitle}>🔵 Google 認證測試</Text>
          <Text style={styles.googleTestDesc}>
            {user ? '已登入，點擊測試 Google 帳號關聯' : '點擊按鈕測試 Google 登入功能'}
          </Text>
          <TouchableOpacity
            style={[styles.googleTestButton, testingGoogle && styles.googleTestButtonDisabled]}
            onPress={async () => {
              console.log('🔵 開始測試 Google 認證...');
              setTestingGoogle(true);
              updateTest(3, { status: 'running', message: '測試中...' });
              
              try {
                const { error } = await signInWithGoogle();
                
                if (error) {
                  console.error('❌ Google 認證失敗:', error);
                  updateTest(3, {
                    status: 'error',
                    message: 'Google 認證失敗',
                    details: `錯誤: ${error.message}\n\n請檢查:\n1. Supabase > Authentication > Providers\n2. Google 提供商已啟用\n3. Redirect URLs 正確設定`,
                  });
                  Alert.alert(
                    '❌ Google 認證失敗',
                    `${error.message}\n\n請確認 Supabase 後台設定`,
                    [{ text: '確定' }]
                  );
                } else {
                  console.log('✅ Google 認證成功!');
                  updateTest(3, {
                    status: 'success',
                    message: 'Google 認證成功',
                    details: `已成功${user ? '關聯' : '登入'} Google 帳號`,
                  });
                  Alert.alert(
                    '✅ 測試成功',
                    `Google 認證功能正常！\n已成功${user ? '關聯' : '登入'}`,
                    [{ text: '確定' }]
                  );
                }
              } catch (err: any) {
                console.error('❌ Google 認證異常:', err);
                updateTest(3, {
                  status: 'error',
                  message: 'Google 認證異常',
                  details: err.message || String(err),
                });
                Alert.alert('❌ 測試異常', err.message || '未知錯誤', [{ text: '確定' }]);
              } finally {
                setTestingGoogle(false);
              }
            }}
            disabled={testingGoogle}
          >
            {testingGoogle ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Chrome size={20} color="#fff" />
            )}
            <Text style={styles.googleTestButtonText}>
              {testingGoogle ? '測試中...' : '測試 Google 登入'}
            </Text>
          </TouchableOpacity>
          {user && (
            <View style={styles.userInfo}>
              <Text style={styles.userInfoText}>👤 當前用戶: {user.email}</Text>
              <Text style={styles.userInfoText}>🔑 登入方式: {user.app_metadata?.provider || 'email'}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            測試完成後，請根據結果進行相應的修復
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  runButtonDisabled: {
    opacity: 0.6,
  },
  runButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testsContainer: {
    padding: 16,
    gap: 12,
  },
  testCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  testIcon: {
    marginRight: 12,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  testMessage: {
    fontSize: 14,
  },
  testDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  testDetailsText: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center' as const,
  },
  googleTestContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4285F4',
  },
  googleTestTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  googleTestDesc: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  googleTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  googleTestButtonDisabled: {
    opacity: 0.6,
  },
  googleTestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  userInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 8,
  },
  userInfoText: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
});
