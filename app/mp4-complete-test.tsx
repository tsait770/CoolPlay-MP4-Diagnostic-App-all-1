import React, { useState, useCallback } from 'react';
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
import * as DocumentPicker from 'expo-document-picker';
import { 
  FileVideo, 
  Globe, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MP4Player from '@/components/MP4Player';
import { testMP4Playability, type MP4DiagnosticsResult } from '@/utils/mp4Diagnostics';
import Colors from '@/constants/colors';

const MP4_TEST_URLS = [
  {
    name: 'Big Buck Bunny 1MB',
    url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
  },
  {
    name: 'Big Buck Bunny 2MB',
    url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_2mb.mp4',
  },
  {
    name: 'Sample 640x360',
    url: 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4',
  },
  {
    name: 'W3Schools BBB',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    name: 'Elephants Dream',
    url: 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
  },
  {
    name: 'Big Buck Bunny 10s',
    url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
  },
  {
    name: 'Learning Container Sample',
    url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
  },
  {
    name: 'Google Storage BBB',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    name: 'Google Storage Elephants Dream',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    name: 'Tears of Steel',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  },
];

type TestStatus = 'pending' | 'testing' | 'passed' | 'failed' | 'warning';

interface TestResult {
  status: TestStatus;
  error?: string;
  diagnostics?: MP4DiagnosticsResult;
  playbackTested?: boolean;
  playbackSuccess?: boolean;
  duration?: number;
}

export default function MP4CompleteTestScreen() {
  const insets = useSafeAreaInsets();
  const [localFiles, setLocalFiles] = useState<Array<{ name: string; uri: string }>>([]);
  const [selectedVideo, setSelectedVideo] = useState<{ type: 'remote' | 'local'; index: number } | null>(null);
  const [remoteResults, setRemoteResults] = useState<Record<number, TestResult>>({});
  const [localResults, setLocalResults] = useState<Record<number, TestResult>>({});
  const [isRunningBatchTest, setIsRunningBatchTest] = useState(false);
  const [testProgress, setTestProgress] = useState({ current: 0, total: 0 });

  const handleSelectLocalFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/mp4',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (file) {
        setLocalFiles(prev => [...prev, { name: file.name, uri: file.uri }]);
        console.log('[MP4CompleteTest] Added local file:', file.name, file.uri);
      }
    } catch (error) {
      console.error('[MP4CompleteTest] File picker error:', error);
      Alert.alert('錯誤', '無法選擇文件');
    }
  }, []);

  const testRemoteUrl = useCallback(async (index: number) => {
    const testUrl = MP4_TEST_URLS[index];
    console.log(`[MP4CompleteTest] Testing remote URL ${index + 1}/${MP4_TEST_URLS.length}:`, testUrl.name);
    
    setRemoteResults(prev => ({
      ...prev,
      [index]: { status: 'testing' }
    }));

    const startTime = Date.now();
    
    try {
      const result = await testMP4Playability(testUrl.url);
      const duration = Date.now() - startTime;
      
      console.log(`[MP4CompleteTest] Remote test result for "${testUrl.name}":`, result);
      
      const status: TestStatus = result.canPlay ? 
        (result.diagnostics.warnings.length > 0 ? 'warning' : 'passed') : 
        'failed';
      
      setRemoteResults(prev => ({
        ...prev,
        [index]: {
          status,
          error: result.reason,
          diagnostics: result.diagnostics,
          playbackTested: true,
          playbackSuccess: result.canPlay,
          duration,
        }
      }));
      
      return { success: result.canPlay, duration };
    } catch (error) {
      console.error(`[MP4CompleteTest] Remote test error for "${testUrl.name}":`, error);
      setRemoteResults(prev => ({
        ...prev,
        [index]: {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        }
      }));
      return { success: false, duration: Date.now() - startTime };
    }
  }, []);

  const testLocalFile = useCallback(async (index: number) => {
    const file = localFiles[index];
    console.log(`[MP4CompleteTest] Testing local file ${index + 1}/${localFiles.length}:`, file.name);
    
    setLocalResults(prev => ({
      ...prev,
      [index]: { status: 'testing' }
    }));

    const startTime = Date.now();
    
    try {
      const result = await testMP4Playability(file.uri);
      const duration = Date.now() - startTime;
      
      console.log(`[MP4CompleteTest] Local test result for "${file.name}":`, result);
      
      const status: TestStatus = result.canPlay ? 
        (result.diagnostics.warnings.length > 0 ? 'warning' : 'passed') : 
        'failed';
      
      setLocalResults(prev => ({
        ...prev,
        [index]: {
          status,
          error: result.reason,
          diagnostics: result.diagnostics,
          playbackTested: true,
          playbackSuccess: result.canPlay,
          duration,
        }
      }));
      
      return { success: result.canPlay, duration };
    } catch (error) {
      console.error(`[MP4CompleteTest] Local test error for "${file.name}":`, error);
      setLocalResults(prev => ({
        ...prev,
        [index]: {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        }
      }));
      return { success: false, duration: Date.now() - startTime };
    }
  }, [localFiles]);

  const runAllTests = useCallback(async () => {
    setIsRunningBatchTest(true);
    const totalTests = MP4_TEST_URLS.length + localFiles.length;
    setTestProgress({ current: 0, total: totalTests });
    
    console.log('[MP4CompleteTest] ========== STARTING BATCH TEST ==========');
    console.log('[MP4CompleteTest] Remote URLs:', MP4_TEST_URLS.length);
    console.log('[MP4CompleteTest] Local files:', localFiles.length);
    console.log('[MP4CompleteTest] Total tests:', totalTests);
    
    const results = {
      remote: { passed: 0, failed: 0, warnings: 0 },
      local: { passed: 0, failed: 0, warnings: 0 },
      totalDuration: 0,
    };

    // Test remote URLs
    for (let i = 0; i < MP4_TEST_URLS.length; i++) {
      const result = await testRemoteUrl(i);
      setTestProgress(prev => ({ ...prev, current: prev.current + 1 }));
      results.totalDuration += result.duration;
      
      if (result.success) {
        const hasWarnings = remoteResults[i]?.status === 'warning';
        if (hasWarnings) {
          results.remote.warnings++;
        } else {
          results.remote.passed++;
        }
      } else {
        results.remote.failed++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test local files
    for (let i = 0; i < localFiles.length; i++) {
      const result = await testLocalFile(i);
      setTestProgress(prev => ({ ...prev, current: prev.current + 1 }));
      results.totalDuration += result.duration;
      
      if (result.success) {
        const hasWarnings = localResults[i]?.status === 'warning';
        if (hasWarnings) {
          results.local.warnings++;
        } else {
          results.local.passed++;
        }
      } else {
        results.local.failed++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('[MP4CompleteTest] ========== BATCH TEST COMPLETE ==========');
    console.log('[MP4CompleteTest] Results:', JSON.stringify(results, null, 2));
    console.log('[MP4CompleteTest] Total duration:', results.totalDuration, 'ms');
    
    setIsRunningBatchTest(false);
    
    Alert.alert(
      '測試完成',
      `遠端影片：✅ ${results.remote.passed} | ⚠️ ${results.remote.warnings} | ❌ ${results.remote.failed}\n` +
      `本地檔案：✅ ${results.local.passed} | ⚠️ ${results.local.warnings} | ❌ ${results.local.failed}\n` +
      `總耗時：${(results.totalDuration / 1000).toFixed(2)}s`
    );
  }, [localFiles, testRemoteUrl, testLocalFile, remoteResults, localResults]);

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'passed':
        return <CheckCircle size={20} color="#10b981" />;
      case 'failed':
        return <XCircle size={20} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={20} color="#f59e0b" />;
      case 'testing':
        return <ActivityIndicator size="small" color={Colors.primary.accent} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: TestStatus) => {
    switch (status) {
      case 'passed': return '#10b981';
      case 'failed': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'testing': return Colors.primary.accent;
      default: return Colors.primary.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>MP4 完整測試</Text>
        <Text style={styles.headerSubtitle}>
          本地檔案 + 遠端網址全面測試
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Control Panel */}
        <View style={styles.controlPanel}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleSelectLocalFile}
          >
            <FileVideo size={20} color="#fff" />
            <Text style={styles.addButtonText}>新增本地檔案</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testAllButton, isRunningBatchTest && styles.buttonDisabled]}
            onPress={runAllTests}
            disabled={isRunningBatchTest}
          >
            {isRunningBatchTest ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Download size={20} color="#fff" />
            )}
            <Text style={styles.testAllButtonText}>
              {isRunningBatchTest ? 
                `測試中 ${testProgress.current}/${testProgress.total}` : 
                '執行全部測試'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Local Files Section */}
        {localFiles.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileVideo size={20} color={Colors.primary.accent} />
              <Text style={styles.sectionTitle}>
                本地檔案 ({localFiles.length})
              </Text>
            </View>
            {localFiles.map((file, index) => {
              const result = localResults[index];
              return (
                <TouchableOpacity
                  key={`local-${index}`}
                  style={[
                    styles.testItem,
                    selectedVideo?.type === 'local' && selectedVideo.index === index && styles.testItemSelected
                  ]}
                  onPress={() => {
                    if (result?.status !== 'testing') {
                      setSelectedVideo({ type: 'local', index });
                    }
                  }}
                  onLongPress={() => testLocalFile(index)}
                >
                  <View style={styles.testItemLeft}>
                    <Text style={styles.testItemTitle}>{file.name}</Text>
                    <Text style={styles.testItemUrl} numberOfLines={1}>{file.uri}</Text>
                    {result?.duration && (
                      <Text style={styles.testItemDuration}>
                        耗時: {(result.duration / 1000).toFixed(2)}s
                      </Text>
                    )}
                  </View>
                  <View style={styles.testItemRight}>
                    {getStatusIcon(result?.status || 'pending')}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Remote URLs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color={Colors.primary.accent} />
            <Text style={styles.sectionTitle}>
              遠端網址 ({MP4_TEST_URLS.length})
            </Text>
          </View>
          {MP4_TEST_URLS.map((testUrl, index) => {
            const result = remoteResults[index];
            return (
              <TouchableOpacity
                key={`remote-${index}`}
                style={[
                  styles.testItem,
                  selectedVideo?.type === 'remote' && selectedVideo.index === index && styles.testItemSelected
                ]}
                onPress={() => {
                  if (result?.status !== 'testing') {
                    setSelectedVideo({ type: 'remote', index });
                  }
                }}
                onLongPress={() => testRemoteUrl(index)}
              >
                <View style={styles.testItemLeft}>
                  <Text style={styles.testItemTitle}>{testUrl.name}</Text>
                  <Text style={styles.testItemUrl} numberOfLines={1}>{testUrl.url}</Text>
                  {result?.duration && (
                    <Text style={styles.testItemDuration}>
                      耗時: {(result.duration / 1000).toFixed(2)}s
                    </Text>
                  )}
                </View>
                <View style={styles.testItemRight}>
                  {getStatusIcon(result?.status || 'pending')}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Video Player */}
        {selectedVideo && (
          <View style={styles.playerSection}>
            <Text style={styles.playerTitle}>播放器測試</Text>
            <View style={styles.playerWrapper}>
              <MP4Player
                uri={
                  selectedVideo.type === 'local'
                    ? localFiles[selectedVideo.index].uri
                    : MP4_TEST_URLS[selectedVideo.index].url
                }
                autoPlay={true}
                onError={(error) => {
                  console.error('[MP4CompleteTest] Playback error:', error);
                }}
                onPlaybackStart={() => {
                  console.log('[MP4CompleteTest] Playback started');
                }}
              />
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 點擊測試項可播放影片{'\n'}
            長按測試項可單獨測試該項目
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 0,
    gap: 24,
  },
  controlPanel: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary.bg,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary.accent,
  },
  addButtonText: {
    color: Colors.primary.accent,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  testAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary.accent,
    paddingVertical: 16,
    borderRadius: 12,
  },
  testAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary.text,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  testItemSelected: {
    borderColor: Colors.primary.accent,
    borderWidth: 2,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  testItemLeft: {
    flex: 1,
    gap: 4,
  },
  testItemTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary.text,
  },
  testItemUrl: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
  },
  testItemDuration: {
    fontSize: 11,
    color: Colors.primary.accent,
    marginTop: 2,
  },
  testItemRight: {
    marginLeft: 12,
  },
  playerSection: {
    gap: 12,
  },
  playerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary.text,
  },
  playerWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
