/* eslint-disable @rork/linters/expo-router-enforce-safe-area-usage */
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
} from 'react-native';

import { Stack } from 'expo-router';
import UniversalVideoPlayer from '@/components/UniversalVideoPlayer';
import { Play, AlertCircle, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface TestCase {
  id: string;
  title: string;
  url: string;
  description: string;
  expectedResult: 'success' | 'fail' | 'unknown';
}

const TEST_CASES: TestCase[] = [
  {
    id: '1',
    title: '公開影片測試',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: '測試標準公開影片是否能正常播放',
    expectedResult: 'success',
  },
  {
    id: '2',
    title: '短影片測試',
    url: 'https://www.youtube.com/shorts/abc123',
    description: '測試 YouTube Shorts 是否能播放',
    expectedResult: 'unknown',
  },
  {
    id: '3',
    title: 'youtu.be 短連結測試',
    url: 'https://youtu.be/dQw4w9WgXcQ',
    description: '測試 youtu.be 短連結格式',
    expectedResult: 'success',
  },
  {
    id: '4',
    title: '嵌入受限影片',
    url: 'https://www.youtube.com/watch?v=DzVKgumDkpo',
    description: '測試有嵌入限制的影片（可能失敗）',
    expectedResult: 'fail',
  },
];

export default function YouTubeTestScreen() {
  const [currentTest, setCurrentTest] = useState<TestCase | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'fail' | 'testing'>>({});
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleTestCase = (testCase: TestCase) => {
    console.log('[YouTubeTest] Starting test:', testCase.title);
    setCurrentTest(testCase);
    setTestResults(prev => ({ ...prev, [testCase.id]: 'testing' }));
    setErrorMessage('');
  };

  const handleTestSuccess = () => {
    if (currentTest) {
      console.log('[YouTubeTest] Test passed:', currentTest.title);
      setTestResults(prev => ({ ...prev, [currentTest.id]: 'success' }));
    }
  };

  const handleTestError = (error: string) => {
    console.error('[YouTubeTest] Test failed:', currentTest?.title, error);
    if (currentTest) {
      setTestResults(prev => ({ ...prev, [currentTest.id]: 'fail' }));
      setErrorMessage(error);
    }
  };

  const handleCustomTest = () => {
    if (!customUrl.trim()) {
      Alert.alert('錯誤', '請輸入 YouTube URL');
      return;
    }

    const customTestCase: TestCase = {
      id: 'custom',
      title: '自訂測試',
      url: customUrl.trim(),
      description: '用戶自訂 URL 測試',
      expectedResult: 'unknown',
    };

    handleTestCase(customTestCase);
  };

  const getStatusIcon = (testId: string) => {
    const status = testResults[testId];
    if (status === 'testing') {
      return <View style={styles.statusIconTesting} />;
    } else if (status === 'success') {
      return <CheckCircle size={20} color="#10b981" />;
    } else if (status === 'fail') {
      return <AlertCircle size={20} color="#ef4444" />;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'YouTube 播放測試',
          headerStyle: {
            backgroundColor: Colors.secondary.bg,
          },
          headerTitleStyle: {
            color: Colors.primary.text,
          },
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>YouTube 播放診斷工具</Text>
          <Text style={styles.infoText}>
            此頁面用於測試和診斷 YouTube 影片播放問題。請依序執行測試案例，並觀察結果。
          </Text>
        </View>

        {/* Test Cases */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>預設測試案例</Text>
          {TEST_CASES.map((testCase) => (
            <TouchableOpacity
              key={testCase.id}
              style={styles.testCaseCard}
              onPress={() => handleTestCase(testCase)}
              activeOpacity={0.7}
            >
              <View style={styles.testCaseHeader}>
                <View style={styles.testCaseLeft}>
                  <Play size={20} color={Colors.accent.primary} />
                  <Text style={styles.testCaseTitle}>{testCase.title}</Text>
                </View>
                {getStatusIcon(testCase.id)}
              </View>
              <Text style={styles.testCaseDescription}>{testCase.description}</Text>
              <Text style={styles.testCaseUrl} numberOfLines={1}>
                {testCase.url}
              </Text>
              <View style={styles.expectedResultBadge}>
                <Text style={[
                  styles.expectedResultText,
                  testCase.expectedResult === 'success' && styles.expectedSuccess,
                  testCase.expectedResult === 'fail' && styles.expectedFail,
                ]}>
                  預期結果: {
                    testCase.expectedResult === 'success' ? '✓ 成功' :
                    testCase.expectedResult === 'fail' ? '✗ 失敗' :
                    '? 未知'
                  }
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>自訂 URL 測試</Text>
          <View style={styles.customTestCard}>
            <TextInput
              style={styles.input}
              placeholder="輸入 YouTube URL"
              placeholderTextColor={Colors.primary.textSecondary}
              value={customUrl}
              onChangeText={setCustomUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleCustomTest}
              activeOpacity={0.7}
            >
              <Play size={20} color="white" />
              <Text style={styles.testButtonText}>開始測試</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Video Player */}
        {currentTest && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>播放器預覽</Text>
            <View style={styles.playerCard}>
              <Text style={styles.currentTestTitle}>{currentTest.title}</Text>
              <View style={styles.playerContainer}>
                <UniversalVideoPlayer
                  url={currentTest.url}
                  onError={handleTestError}
                  onPlaybackStart={handleTestSuccess}
                  autoPlay={false}
                  maxRetries={3}
                  loadTimeout={30000}
                />
              </View>
              {errorMessage && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={20} color="#ef4444" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Test Results Summary */}
        {Object.keys(testResults).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>測試結果摘要</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>總測試數:</Text>
                <Text style={styles.summaryValue}>{Object.keys(testResults).length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>成功:</Text>
                <Text style={[styles.summaryValue, styles.successText]}>
                  {Object.values(testResults).filter(r => r === 'success').length}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>失敗:</Text>
                <Text style={[styles.summaryValue, styles.failText]}>
                  {Object.values(testResults).filter(r => r === 'fail').length}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>測試中:</Text>
                <Text style={styles.summaryValue}>
                  {Object.values(testResults).filter(r => r === 'testing').length}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Debug Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>除錯資訊</Text>
          <View style={styles.debugCard}>
            <Text style={styles.debugText}>
              • 檢查 Console 日誌以獲取詳細資訊{'\n'}
              • 尋找以 [YouTubeTest] 或 [UniversalVideoPlayer] 開頭的日誌{'\n'}
              • 注意 &quot;YouTube embed URL&quot; 和錯誤訊息{'\n'}
              • 如果影片無法播放，請複製 embed URL 在瀏覽器中測試
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: Colors.accent.primary + '15',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.accent.primary + '30',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginBottom: 12,
  },
  testCaseCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  testCaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  testCaseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  testCaseTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary.text,
  },
  testCaseDescription: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  testCaseUrl: {
    fontSize: 12,
    color: Colors.accent.primary,
    fontFamily: 'monospace' as const,
    marginBottom: 8,
  },
  expectedResultBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.card.bg,
  },
  expectedResultText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.primary.textSecondary,
  },
  expectedSuccess: {
    color: '#10b981',
  },
  expectedFail: {
    color: '#ef4444',
  },
  statusIconTesting: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.accent.primary,
    backgroundColor: 'transparent',
  },
  customTestCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  input: {
    backgroundColor: Colors.card.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.primary.text,
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'white',
  },
  playerCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  currentTestTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginBottom: 12,
  },
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#ef444415',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef444430',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#ef4444',
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary.text,
  },
  successText: {
    color: '#10b981',
  },
  failText: {
    color: '#ef4444',
  },
  debugCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  debugText: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
    fontFamily: 'monospace' as const,
  },
});
