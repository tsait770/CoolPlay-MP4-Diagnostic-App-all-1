import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Stack } from 'expo-router';

import { Play, CheckCircle, XCircle, Download } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { 
  runAllTests, 
  testSpecificCategory, 
  generateTestReport,
  exportTestResults,
  TestSummary 
} from '@/utils/playbackTesting';

export default function PlaybackTestScreen() {
  const [testSummary, setTestSummary] = useState<TestSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Mainstream' | 'Adult' | 'Social Media' | 'Other'>('All');

  const runTests = async () => {
    setIsRunning(true);
    setTestSummary(null);

    try {
      let summary: TestSummary;
      
      if (selectedCategory === 'All') {
        summary = runAllTests();
      } else {
        summary = testSpecificCategory(selectedCategory);
      }
      
      setTestSummary(summary);
    } catch (error) {
      console.error('[PlaybackTest] Error running tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const shareReport = async () => {
    if (!testSummary) return;

    try {
      const report = generateTestReport(testSummary);
      await Share.share({
        message: report,
        title: 'InstaPlay Playback Test Report',
      });
    } catch (error) {
      console.error('[PlaybackTest] Error sharing report:', error);
    }
  };

  const exportResults = async () => {
    if (!testSummary) return;

    try {
      const json = exportTestResults(testSummary);
      await Share.share({
        message: json,
        title: 'InstaPlay Test Results (JSON)',
      });
    } catch (error) {
      console.error('[PlaybackTest] Error exporting results:', error);
    }
  };

  const renderCategoryButton = (category: typeof selectedCategory) => {
    const isSelected = selectedCategory === category;
    return (
      <TouchableOpacity
        key={category}
        style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
        onPress={() => setSelectedCategory(category)}
      >
        <Text style={[styles.categoryButtonText, isSelected && styles.categoryButtonTextSelected]}>
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  const getSuccessColor = (rate: number) => {
    if (rate >= 90) return Colors.semantic.success;
    if (rate >= 70) return '#FFA500';
    return Colors.semantic.danger;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Playback Testing',
          headerStyle: {
            backgroundColor: Colors.primary.bg,
          },
          headerTintColor: Colors.primary.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>播放器測試系統</Text>
          <Text style={styles.subtitle}>
            測試所有平台的 URL 檢測與播放支持
          </Text>
        </View>

        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>選擇測試類別</Text>
          <View style={styles.categoryButtons}>
            {(['All', 'Mainstream', 'Adult', 'Social Media', 'Other'] as const).map(renderCategoryButton)}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.runButton, isRunning && styles.runButtonDisabled]}
          onPress={runTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.runButtonText}>運行測試中...</Text>
            </>
          ) : (
            <>
              <Play size={20} color="#fff" fill="#fff" />
              <Text style={styles.runButtonText}>
                運行 {selectedCategory} 測試
              </Text>
            </>
          )}
        </TouchableOpacity>

        {testSummary && (
          <View style={styles.resultsContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>測試摘要</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>總測試數</Text>
                <Text style={styles.summaryValue}>{testSummary.totalTests}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>通過</Text>
                <Text style={[styles.summaryValue, { color: Colors.semantic.success }]}>
                  {testSummary.passed}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>失敗</Text>
                <Text style={[styles.summaryValue, { color: Colors.semantic.danger }]}>
                  {testSummary.failed}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>成功率</Text>
                <Text style={[styles.summaryValue, { color: getSuccessColor(testSummary.successRate) }]}>
                  {testSummary.successRate.toFixed(2)}%
                </Text>
              </View>
            </View>

            <View style={styles.categoryBreakdown}>
              <Text style={styles.sectionTitle}>類別詳情</Text>
              {Object.entries(testSummary.categoryBreakdown).map(([category, breakdown]) => (
                <View key={category} style={styles.breakdownCard}>
                  <View style={styles.breakdownHeader}>
                    <Text style={styles.breakdownCategory}>{category}</Text>
                    <Text style={[styles.breakdownRate, { color: getSuccessColor(breakdown.successRate) }]}>
                      {breakdown.successRate.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.breakdownStats}>
                    <Text style={styles.breakdownStat}>
                      總數: {breakdown.total}
                    </Text>
                    <Text style={[styles.breakdownStat, { color: Colors.semantic.success }]}>
                      通過: {breakdown.passed}
                    </Text>
                    <Text style={[styles.breakdownStat, { color: Colors.semantic.danger }]}>
                      失敗: {breakdown.failed}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>詳細結果</Text>
              {testSummary.results.map((result, index) => (
                <View key={index} style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    {result.success ? (
                      <CheckCircle size={20} color={Colors.semantic.success} />
                    ) : (
                      <XCircle size={20} color={Colors.semantic.danger} />
                    )}
                    <Text style={styles.resultPlatform}>{result.platform}</Text>
                  </View>
                  
                  <View style={styles.resultDetails}>
                    <Text style={styles.resultLabel}>類別: <Text style={styles.resultValue}>{result.category}</Text></Text>
                    <Text style={styles.resultLabel}>檢測類型: <Text style={styles.resultValue}>{result.detectedType}</Text></Text>
                    <Text style={styles.resultLabel}>檢測平台: <Text style={styles.resultValue}>{result.detectedPlatform}</Text></Text>
                    {result.requiresWebView && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>WebView</Text>
                      </View>
                    )}
                    {result.requiresAgeVerification && (
                      <View style={[styles.badge, styles.badgeWarning]}>
                        <Text style={styles.badgeText}>18+</Text>
                      </View>
                    )}
                    {result.error && (
                      <Text style={styles.resultError}>錯誤: {result.error}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.actionsSection}>
              <TouchableOpacity style={styles.actionButton} onPress={shareReport}>
                <Download size={20} color="#fff" />
                <Text style={styles.actionButtonText}>分享報告</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={exportResults}>
                <Download size={20} color={Colors.primary.accent} />
                <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                  導出 JSON
                </Text>
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
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.card.bg,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  categoryButtonSelected: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary.text,
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  runButtonDisabled: {
    opacity: 0.6,
  },
  runButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resultsContainer: {
    gap: 20,
  },
  summaryCard: {
    backgroundColor: Colors.card.bg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 16,
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
    fontWeight: '600',
    color: Colors.primary.text,
  },
  categoryBreakdown: {
    gap: 12,
  },
  breakdownCard: {
    backgroundColor: Colors.card.bg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
  },
  breakdownRate: {
    fontSize: 18,
    fontWeight: '700',
  },
  breakdownStats: {
    flexDirection: 'row',
    gap: 16,
  },
  breakdownStat: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
  },
  detailsSection: {
    gap: 12,
  },
  resultCard: {
    backgroundColor: Colors.card.bg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resultPlatform: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
  },
  resultDetails: {
    gap: 6,
  },
  resultLabel: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
  },
  resultValue: {
    color: Colors.primary.text,
    fontWeight: '500',
  },
  resultError: {
    fontSize: 12,
    color: Colors.semantic.danger,
    marginTop: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  badgeWarning: {
    backgroundColor: '#FFA500',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary.accent,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary.accent,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtonTextSecondary: {
    color: Colors.primary.accent,
  },
});
