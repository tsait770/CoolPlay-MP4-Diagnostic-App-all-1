import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';

import { Play, Info, AlertCircle, CheckCircle, XCircle } from 'lucide-react-native';
import MP4Player from '@/components/MP4Player';
import { diagnoseMP4Playback, printMP4Diagnostics } from '@/utils/mp4Diagnostics';
import { detectVideoSource } from '@/utils/videoSourceDetector';
import Colors from '@/constants/colors';

export default function MP4DiagnosticScreen() {
  const [url, setUrl] = useState('');
  const [testUrl, setTestUrl] = useState('');
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [playerLoaded, setPlayerLoaded] = useState(false);

  const testUrls = [
    {
      name: 'Sample MP4 (Big Buck Bunny)',
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    {
      name: 'Sample MP4 (Elephants Dream)',
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    },
    {
      name: 'Sample WebM',
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    },
  ];

  const runDiagnostics = () => {
    if (!url.trim()) {
      return;
    }

    console.log('[MP4Diagnostic] Running diagnostics for:', url);
    const result = diagnoseMP4Playback(url);
    setDiagnostics(result);
    printMP4Diagnostics(url);
    
    const sourceInfo = detectVideoSource(url);
    console.log('[MP4Diagnostic] Source Info:', JSON.stringify(sourceInfo, null, 2));
  };

  const testPlayback = () => {
    if (!url.trim()) {
      return;
    }

    console.log('[MP4Diagnostic] Testing playback for:', url);
    setTestUrl(url);
    setShowPlayer(true);
    setPlayerError(null);
    setPlayerLoaded(false);
  };

  const resetTest = () => {
    setShowPlayer(false);
    setTestUrl('');
    setPlayerError(null);
    setPlayerLoaded(false);
  };

  const renderDiagnosticItem = (label: string, value: any, isGood?: boolean) => {
    return (
      <View style={styles.diagnosticItem}>
        <View style={styles.diagnosticLabel}>
          {isGood === true ? (
            <CheckCircle size={16} color="#10b981" />
          ) : isGood === false ? (
            <XCircle size={16} color="#ef4444" />
          ) : (
            <Info size={16} color={Colors.primary.textSecondary} />
          )}
          <Text style={styles.diagnosticLabelText}>{label}</Text>
        </View>
        <Text style={styles.diagnosticValue}>{String(value)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'MP4 播放診斷工具',
          headerStyle: {
            backgroundColor: Colors.primary.bg,
          },
          headerTintColor: Colors.primary.text,
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>測試 URL</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="輸入 MP4 視頻 URL"
            placeholderTextColor={Colors.primary.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            multiline
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={runDiagnostics}
              activeOpacity={0.7}
            >
              <Info size={20} color="#fff" />
              <Text style={styles.buttonText}>執行診斷</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.successButton]}
              onPress={testPlayback}
              activeOpacity={0.7}
            >
              <Play size={20} color="#fff" />
              <Text style={styles.buttonText}>測試播放</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快速測試 URL</Text>
          {testUrls.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.testUrlItem}
              onPress={() => setUrl(item.url)}
              activeOpacity={0.7}
            >
              <Text style={styles.testUrlName}>{item.name}</Text>
              <Text style={styles.testUrlUrl} numberOfLines={1}>
                {item.url}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {diagnostics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>診斷結果</Text>
            <View style={styles.diagnosticsCard}>
              {renderDiagnosticItem('URL 有效', diagnostics.isValidUrl ? '是' : '否', diagnostics.isValidUrl)}
              {renderDiagnosticItem('檢測類型', diagnostics.detectedType)}
              {renderDiagnosticItem('平台', diagnostics.detectedPlatform)}
              {diagnostics.streamType && renderDiagnosticItem('流類型', diagnostics.streamType.toUpperCase())}
              {renderDiagnosticItem(
                '應使用 MP4Player',
                diagnostics.shouldUseMp4Player ? '是' : '否',
                diagnostics.shouldUseMp4Player
              )}
              {renderDiagnosticItem(
                '有視頻擴展名',
                diagnostics.urlHasMp4Extension ? '是' : '否',
                diagnostics.urlHasMp4Extension
              )}
              {renderDiagnosticItem('使用 HTTPS', diagnostics.isHttps ? '是' : '否', diagnostics.isHttps)}
              {renderDiagnosticItem(
                '需要 WebView',
                diagnostics.requiresWebView ? '是' : '否',
                !diagnostics.requiresWebView
              )}

              {diagnostics.potentialIssues.length > 0 && (
                <View style={styles.issuesContainer}>
                  <View style={styles.issuesHeader}>
                    <AlertCircle size={16} color="#f59e0b" />
                    <Text style={styles.issuesTitle}>潛在問題</Text>
                  </View>
                  {diagnostics.potentialIssues.map((issue: string, i: number) => (
                    <Text key={i} style={styles.issueText}>
                      • {issue}
                    </Text>
                  ))}
                </View>
              )}

              {diagnostics.recommendations.length > 0 && (
                <View style={styles.recommendationsContainer}>
                  <View style={styles.recommendationsHeader}>
                    <Info size={16} color="#3b82f6" />
                    <Text style={styles.recommendationsTitle}>建議</Text>
                  </View>
                  {diagnostics.recommendations.map((rec: string, i: number) => (
                    <Text key={i} style={styles.recommendationText}>
                      {i + 1}. {rec}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {showPlayer && testUrl && (
          <View style={styles.section}>
            <View style={styles.playerHeader}>
              <Text style={styles.sectionTitle}>播放器測試</Text>
              <TouchableOpacity onPress={resetTest} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>重置</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.playerContainer}>
              <MP4Player
                uri={testUrl}
                autoPlay={true}
                onError={(error) => {
                  console.error('[MP4Diagnostic] Player error:', error);
                  setPlayerError(error);
                }}
                onLoad={() => {
                  console.log('[MP4Diagnostic] Player loaded successfully');
                  setPlayerLoaded(true);
                }}
                onPlaybackStart={() => {
                  console.log('[MP4Diagnostic] Playback started');
                }}
              />
            </View>

            <View style={styles.playerStatus}>
              {playerLoaded && !playerError && (
                <View style={styles.statusItem}>
                  <CheckCircle size={16} color="#10b981" />
                  <Text style={[styles.statusText, { color: '#10b981' }]}>
                    視頻加載成功
                  </Text>
                </View>
              )}

              {playerError && (
                <View style={styles.statusItem}>
                  <XCircle size={16} color="#ef4444" />
                  <Text style={[styles.statusText, { color: '#ef4444' }]}>
                    播放錯誤: {playerError}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>系統信息</Text>
          <View style={styles.diagnosticsCard}>
            <Text style={styles.infoText}>Platform: {Platform.OS}</Text>
            <Text style={styles.infoText}>
              Platform Version: {Platform.Version}
            </Text>
            <Text style={styles.infoText}>
              MP4Player: ✅ 已實現 (使用 expo-video)
            </Text>
            <Text style={styles.infoText}>
              視頻源檢測: ✅ 已實現
            </Text>
            <Text style={styles.infoText}>
              路由系統: ✅ 已配置 (direct → native)
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>使用說明</Text>
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionText}>
              1. 輸入或選擇一個測試 URL{'\n'}
              2. 點擊「執行診斷」查看 URL 檢測結果{'\n'}
              3. 點擊「測試播放」實際測試視頻播放{'\n'}
              4. 查看控制台日誌獲取詳細信息{'\n'}
              {'\n'}
              支持的格式: MP4, WebM, OGG, MKV, AVI, MOV 等{'\n'}
              {'\n'}
              注意: 某些 HTTP URL 可能因安全原因無法播放，建議使用 HTTPS
            </Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: Colors.primary.text,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary.accent,
  },
  successButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  testUrlItem: {
    backgroundColor: Colors.surface.secondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  testUrlName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 4,
  },
  testUrlUrl: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
  },
  diagnosticsCard: {
    backgroundColor: Colors.surface.secondary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  diagnosticItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
  },
  diagnosticLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  diagnosticLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary.textSecondary,
  },
  diagnosticValue: {
    fontSize: 14,
    color: Colors.primary.text,
    marginLeft: 24,
  },
  issuesContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  issuesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  issuesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  issueText: {
    fontSize: 13,
    color: '#d97706',
    marginBottom: 4,
    lineHeight: 18,
  },
  recommendationsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  recommendationText: {
    fontSize: 13,
    color: '#2563eb',
    marginBottom: 4,
    lineHeight: 18,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resetButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface.secondary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  resetButtonText: {
    fontSize: 13,
    color: Colors.primary.accent,
    fontWeight: '600',
  },
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  playerStatus: {
    marginTop: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.surface.secondary,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    color: Colors.primary.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  instructionsCard: {
    backgroundColor: Colors.surface.secondary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 22,
  },
});
