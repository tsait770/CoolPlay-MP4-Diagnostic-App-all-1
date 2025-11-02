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
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type TestStatus = 'pending' | 'running' | 'success' | 'error';

interface TestResult {
  name: string;
  status: TestStatus;
  message: string;
  details?: string;
}

export default function ConnectionTestScreen() {
  const insets = useSafeAreaInsets();
  const [tests, setTests] = useState<TestResult[]>([
    { name: '環境變數驗證', status: 'pending', message: '等待測試...' },
    { name: 'Supabase 連接測試', status: 'pending', message: '等待測試...' },
    { name: '數據庫表驗證', status: 'pending', message: '等待測試...' },
    { name: 'tRPC API 連接測試', status: 'pending', message: '等待測試...' },
    { name: '會員系統測試', status: 'pending', message: '等待測試...' },
    { name: '設備綁定測試', status: 'pending', message: '等待測試...' },
    { name: '語音配額測試', status: 'pending', message: '等待測試...' },
  ]);
  const [isRunning, setIsRunning] = useState(false);

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
      const apiUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL;

      if (!supabaseUrl || !supabaseKey) {
        updateTest(0, {
          status: 'error',
          message: '環境變數缺失',
          details: `URL: ${supabaseUrl ? '✓' : '✗'}\nKey: ${supabaseKey ? '✓' : '✗'}`,
        });
      } else {
        updateTest(0, {
          status: 'success',
          message: '環境變數正確配置',
          details: `URL: ${supabaseUrl}\nAPI URL: ${apiUrl || '未設置'}`,
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

      // 測試 4: tRPC API 連接測試
      updateTest(3, { status: 'running', message: '測試中...' });
      try {
        // 這裡需要根據你的實際 tRPC 路由來調整
        // 假設有一個測試用的 hello 或 hi endpoint
        const result = await fetch(`${apiUrl || 'http://localhost:8081'}/api/trpc/example.hi`, {
          method: 'GET',
        });

        if (result.ok) {
          updateTest(3, {
            status: 'success',
            message: 'tRPC API 連接成功',
            details: `狀態碼: ${result.status}`,
          });
        } else {
          updateTest(3, {
            status: 'error',
            message: 'tRPC API 響應錯誤',
            details: `狀態碼: ${result.status}`,
          });
        }
      } catch (error) {
        updateTest(3, {
          status: 'error',
          message: 'tRPC API 連接失敗',
          details: error instanceof Error ? error.message : String(error),
        });
      }

      // 測試 5: 會員系統測試
      updateTest(4, { status: 'running', message: '測試中...' });
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session?.session) {
          updateTest(4, {
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
            updateTest(4, {
              status: 'error',
              message: '會員資料查詢失敗',
              details: error.message,
            });
          } else if (!profile) {
            updateTest(4, {
              status: 'error',
              message: '會員資料不存在',
              details: '請確認 profiles 表已正確初始化',
            });
          } else {
            updateTest(4, {
              status: 'success',
              message: '會員系統正常',
              details: `會員等級: ${profile.membership_tier}\n配額: ${profile.monthly_usage_remaining}`,
            });
          }
        }
      } catch (error) {
        updateTest(4, {
          status: 'error',
          message: '會員系統測試失敗',
          details: error instanceof Error ? error.message : String(error),
        });
      }

      // 測試 6: 設備綁定測試
      updateTest(5, { status: 'running', message: '測試中...' });
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session?.session) {
          updateTest(5, {
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
            updateTest(5, {
              status: 'error',
              message: '設備查詢失敗',
              details: error.message,
            });
          } else {
            updateTest(5, {
              status: 'success',
              message: '設備綁定系統正常',
              details: `已綁定設備數: ${devices?.length || 0}`,
            });
          }
        }
      } catch (error) {
        updateTest(5, {
          status: 'error',
          message: '設備綁定測試失敗',
          details: error instanceof Error ? error.message : String(error),
        });
      }

      // 測試 7: 語音配額測試
      updateTest(6, { status: 'running', message: '測試中...' });
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session?.session) {
          updateTest(6, {
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
            updateTest(6, {
              status: 'error',
              message: '配額查詢失敗',
              details: error.message,
            });
          } else {
            updateTest(6, {
              status: 'success',
              message: '語音配額系統正常',
              details: `使用記錄數: ${usageLogs?.length || 0}`,
            });
          }
        }
      } catch (error) {
        updateTest(6, {
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
    textAlign: 'center',
  },
});
