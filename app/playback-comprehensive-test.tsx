import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Play, Download, RefreshCw, CheckCircle, AlertCircle, XCircle } from 'lucide-react-native';
import { playbackTester, TestReport, TestResult } from '@/utils/playbackTester';
import Colors from '@/constants/colors';

export default function PlaybackComprehensiveTestScreen() {
  const insets = useSafeAreaInsets();
  const [testing, setTesting] = useState(false);
  const [report, setReport] = useState<TestReport | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const runTests = async () => {
    setTesting(true);
    setReport(null);
    
    try {
      const testReport = await playbackTester.runAllTests();
      setReport(testReport);
    } catch (error) {
      console.error('[PlaybackTest] Error running tests:', error);
    } finally {
      setTesting(false);
    }
  };

  const shareReport = async () => {
    if (!report) return;
    
    const markdown = playbackTester.exportReportAsMarkdown(report);
    
    try {
      await Share.share({
        message: markdown,
        title: '影片播放系統測試報告',
      });
    } catch (error) {
      console.error('[PlaybackTest] Error sharing report:', error);
    }
  };

  const getConfidenceIcon = (confidence: TestResult['confidence']) => {
    switch (confidence) {
      case 'high':
        return <CheckCircle size={20} color={Colors.semantic.success} />;
      case 'medium':
        return <AlertCircle size={20} color={Colors.semantic.warning} />;
      default:
        return <XCircle size={20} color={Colors.semantic.danger} />;
    }
  };

  const getConfidenceColor = (confidence: TestResult['confidence']) => {
    switch (confidence) {
      case 'high':
        return Colors.semantic.success;
      case 'medium':
        return Colors.semantic.warning;
      default:
        return Colors.semantic.danger;
    }
  };

  const categories = report 
    ? ['all', ...Object.keys(report.categoryBreakdown)]
    : ['all'];

  const filteredResults = report?.results.filter(r =>
    selectedCategory === 'all' || r.category === selectedCategory
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: '播放系統綜合測試',
          headerStyle: { backgroundColor: Colors.surface.primary },
          headerTintColor: Colors.primary.text,
        }}
      />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
      >
        {!report && !testing && (
          <View style={styles.welcomeSection}>
            <Play size={64} color={Colors.primary.accent} />
            <Text style={styles.welcomeTitle}>影片播放系統測試</Text>
            <Text style={styles.welcomeText}>
              這個工具將測試所有支援的影片平台，包括主流平台、成人網站、直播平台、串流格式等。
            </Text>
            <Text style={styles.welcomeText}>
              測試將檢查：
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>• 平台識別能力</Text>
              <Text style={styles.featureItem}>• 來源解析器</Text>
              <Text style={styles.featureItem}>• WebView/Native Player 選擇</Text>
              <Text style={styles.featureItem}>• 認證需求</Text>
              <Text style={styles.featureItem}>• 年齡驗證需求</Text>
            </View>
            
            <TouchableOpacity style={styles.startButton} onPress={runTests}>
              <Play size={24} color="#fff" />
              <Text style={styles.startButtonText}>開始測試</Text>
            </TouchableOpacity>
          </View>
        )}

        {testing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.accent} />
            <Text style={styles.loadingText}>正在測試所有影片平台...</Text>
            <Text style={styles.loadingSubtext}>這可能需要幾秒鐘</Text>
          </View>
        )}

        {report && !testing && (
          <View style={styles.reportContainer}>
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>📊 測試統計</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{report.totalTests}</Text>
                  <Text style={styles.statLabel}>總測試數</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.semantic.success }]}>
                    {report.supportedCount}
                  </Text>
                  <Text style={styles.statLabel}>完全支援</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.semantic.warning }]}>
                    {report.partialSupportCount}
                  </Text>
                  <Text style={styles.statLabel}>部分支援</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.semantic.danger }]}>
                    {report.unsupportedCount}
                  </Text>
                  <Text style={styles.statLabel}>不支援</Text>
                </View>
              </View>
              
              <View style={styles.successRateContainer}>
                <Text style={styles.successRateLabel}>總體成功率</Text>
                <View style={styles.successRateBar}>
                  <View
                    style={[
                      styles.successRateFill,
                      {
                        width: `${report.successRate}%`,
                        backgroundColor: report.successRate >= 80
                          ? Colors.semantic.success
                          : report.successRate >= 50
                          ? Colors.semantic.warning
                          : Colors.semantic.danger,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.successRateValue}>{report.successRate.toFixed(1)}%</Text>
              </View>
            </View>

            <View style={styles.categoryBreakdownCard}>
              <Text style={styles.cardTitle}>📁 分類統計</Text>
              {Object.entries(report.categoryBreakdown).map(([category, stats]) => {
                const rate = ((stats.supported + stats.partial * 0.5) / stats.total) * 100;
                return (
                  <View key={category} style={styles.categoryRow}>
                    <Text style={styles.categoryName}>{category}</Text>
                    <View style={styles.categoryStats}>
                      <Text style={styles.categoryCount}>
                        {stats.supported + stats.partial}/{stats.total}
                      </Text>
                      <View style={styles.categoryBar}>
                        <View
                          style={[
                            styles.categoryBarFill,
                            {
                              width: `${rate}%`,
                              backgroundColor: rate >= 80
                                ? Colors.semantic.success
                                : rate >= 50
                                ? Colors.semantic.warning
                                : Colors.semantic.danger,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {report.recommendations.length > 0 && (
              <View style={styles.recommendationsCard}>
                <Text style={styles.cardTitle}>💡 改進建議</Text>
                {report.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Text style={styles.recommendationBullet}>•</Text>
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>篩選分類：</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.filterButton,
                      selectedCategory === cat && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedCategory === cat && styles.filterButtonTextActive,
                      ]}
                    >
                      {cat === 'all' ? '全部' : cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.resultsCard}>
              <Text style={styles.cardTitle}>🎯 測試結果詳細</Text>
              {filteredResults?.map((result, index) => (
                <View key={index} style={styles.resultItem}>
                  <View style={styles.resultHeader}>
                    {getConfidenceIcon(result.confidence)}
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{result.name}</Text>
                      <Text style={styles.resultPlatform}>{result.platform}</Text>
                    </View>
                    <View style={[styles.resultBadge, { backgroundColor: getConfidenceColor(result.confidence) + '20' }]}>
                      <Text style={[styles.resultBadgeText, { color: getConfidenceColor(result.confidence) }]}>
                        {result.confidence}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.resultDetails}>
                    <Text style={styles.resultDetail}>類型: {result.sourceType}</Text>
                    {result.requiresWebView && (
                      <Text style={styles.resultDetail}>• 需要 WebView</Text>
                    )}
                    {result.requiresAuth && (
                      <Text style={styles.resultDetail}>• 需要認證</Text>
                    )}
                    {result.requiresAgeVerification && (
                      <Text style={styles.resultDetail}>• 需要年齡驗證</Text>
                    )}
                    {result.canResolve && (
                      <Text style={styles.resultDetail}>• Resolver 可用</Text>
                    )}
                  </View>

                  {result.notes.length > 0 && (
                    <View style={styles.resultNotes}>
                      {result.notes.map((note, i) => (
                        <Text key={i} style={styles.resultNote}>
                          • {note}
                        </Text>
                      ))}
                    </View>
                  )}

                  {result.error && (
                    <View style={styles.resultError}>
                      <Text style={styles.resultErrorText}>{result.error}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={runTests}>
                <RefreshCw size={20} color={Colors.primary.accent} />
                <Text style={styles.actionButtonText}>重新測試</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={shareReport}>
                <Download size={20} color={Colors.primary.accent} />
                <Text style={styles.actionButtonText}>匯出報告</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  scrollContent: {
    padding: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary.text,
    marginTop: 20,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.primary.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featureList: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surface.primary,
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
  },
  featureItem: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    marginBottom: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary.text,
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    marginTop: 8,
  },
  reportContainer: {
    gap: 16,
  },
  statsCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    padding: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginTop: 4,
  },
  successRateContainer: {
    marginTop: 16,
  },
  successRateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  successRateBar: {
    height: 12,
    backgroundColor: Colors.surface.tertiary,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  successRateFill: {
    height: '100%',
    borderRadius: 6,
  },
  successRateValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary.text,
    textAlign: 'center',
  },
  categoryBreakdownCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
    flex: 1,
  },
  categoryStats: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.textSecondary,
    minWidth: 60,
    textAlign: 'right',
  },
  categoryBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surface.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  recommendationsCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    padding: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationBullet: {
    fontSize: 16,
    color: Colors.primary.accent,
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
  },
  filterContainer: {
    marginVertical: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface.primary,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary.accent,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.textSecondary,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  resultsCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    padding: 20,
  },
  resultItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.tertiary,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
  },
  resultPlatform: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginTop: 2,
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultDetails: {
    marginLeft: 32,
    marginTop: 8,
  },
  resultDetail: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    marginBottom: 4,
  },
  resultNotes: {
    marginLeft: 32,
    marginTop: 8,
    backgroundColor: Colors.surface.tertiary,
    borderRadius: 8,
    padding: 12,
  },
  resultNote: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginBottom: 4,
  },
  resultError: {
    marginLeft: 32,
    marginTop: 8,
    backgroundColor: Colors.semantic.danger + '20',
    borderRadius: 8,
    padding: 12,
  },
  resultErrorText: {
    fontSize: 12,
    color: Colors.semantic.danger,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface.primary,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.accent,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.accent,
  },
});
