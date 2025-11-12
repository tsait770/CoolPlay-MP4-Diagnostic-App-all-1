import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { 
  TestTube2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  X,
} from 'lucide-react-native';
import { 
  diagnoseMP4Url, 
  type MP4DiagnosticsResult 
} from '@/utils/mp4Diagnostics';
import { prepareLocalVideo, type PrepareLocalVideoResult } from '@/utils/videoHelpers';
import Colors from '@/constants/colors';

export interface MP4DiagnosticToolProps {
  visible: boolean;
  onClose: () => void;
  initialUrl?: string;
  onLoadVideo?: (url: string) => void;
}

export function MP4DiagnosticTool({ 
  visible, 
  onClose, 
  initialUrl = '',
  onLoadVideo 
}: MP4DiagnosticToolProps) {
  const [testUrl, setTestUrl] = useState(initialUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<MP4DiagnosticsResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [prepareResult, setPrepareResult] = useState<PrepareLocalVideoResult | null>(null);

  React.useEffect(() => {
    if (visible && initialUrl && initialUrl !== testUrl) {
      setTestUrl(initialUrl);
    }
  }, [visible, initialUrl, testUrl]);

  const handlePickFile = async () => {
    try {
      console.log('[MP4DiagnosticTool] Opening document picker...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/mp4', 'video/*'],
        copyToCacheDirectory: Platform.OS === 'ios',
      });
      
      console.log('[MP4DiagnosticTool] Document picker result:', {
        canceled: result.canceled,
        assets: result.assets?.length || 0
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (file) {
        console.log('[MP4DiagnosticTool] ========== File Selected ==========');
        console.log('[MP4DiagnosticTool] Name:', file.name);
        console.log('[MP4DiagnosticTool] URI:', file.uri);
        console.log('[MP4DiagnosticTool] Size:', file.size, 'bytes');
        console.log('[MP4DiagnosticTool] MIME type:', file.mimeType);
        console.log('[MP4DiagnosticTool] Platform:', Platform.OS);
        
        setSelectedFile(file.name);
        setTestUrl(file.uri);
        
        // Auto-run diagnostics for local files
        setTimeout(() => handleTest(), 100);
      }
    } catch (error) {
      console.error('[MP4DiagnosticTool] File picker error:', error);
      console.error('[MP4DiagnosticTool] ❌ 無法選擇文件:', error instanceof Error ? error.message : String(error));
    }
  };

  const handleTest = async () => {
    if (!testUrl.trim() && !selectedFile) {
      console.error('[MP4DiagnosticTool] ❌ No URL or file selected');
      return;
    }

    setIsTesting(true);
    setResult(null);
    setPrepareResult(null);

    try {
      console.log('[MP4DiagnosticTool] Testing URL:', testUrl.trim());
      const url = testUrl.trim();
      
      // Check if this is a local file
      const isLocalFile = url.startsWith('file://') || 
                          url.startsWith('content://') || 
                          url.startsWith('ph://') ||
                          url.startsWith('assets-library://');
      
      if (isLocalFile) {
        console.log('[MP4DiagnosticTool] Local file detected, preparing...');
        const prepResult = await prepareLocalVideo(url);
        setPrepareResult(prepResult);
        console.log('[MP4DiagnosticTool] Prepare result:', prepResult);
        
        if (prepResult.success && prepResult.uri) {
          // For local files, create simplified diagnostic result
          const diagResult: MP4DiagnosticsResult = {
            isValid: true,
            url: prepResult.uri,
            isLocalFile: true,
            httpStatus: 200,
            contentType: 'video/mp4',
            acceptRanges: true,
            corsEnabled: true,
            errors: [],
            warnings: [],
            recommendations: [
              '本地文件已成功準備播放',
              prepResult.needsCopy ? '文件已複製到應用快取目錄' : '文件可直接訪問',
            ],
            fileInfo: {
              name: url.split('/').pop() || 'Unknown',
              size: prepResult.size || 0,
            },
          };
          setResult(diagResult);
          console.log('[MP4DiagnosticTool] Local file diagnostic complete:', diagResult);
        } else {
          // Show prepare error
          const diagResult: MP4DiagnosticsResult = {
            isValid: false,
            url,
            isLocalFile: true,
            errors: [prepResult.error || 'Failed to prepare local file'],
            warnings: [],
            recommendations: [
              '請確保應用有權限讀取該文件',
              '檢查儲存空間是否充足',
              '嘗試重新選擇文件',
            ],
          };
          setResult(diagResult);
        }
      } else {
        // Remote URL - diagnose directly
        const diagResult = await diagnoseMP4Url(url);
        setResult(diagResult);
        console.log('[MP4DiagnosticTool] Diagnostic complete:', diagResult);
      }
    } catch (error) {
      console.error('[MP4DiagnosticTool] Test failed:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      const diagResult: MP4DiagnosticsResult = {
        isValid: false,
        url: testUrl,
        errors: [errorMsg],
        warnings: [],
        recommendations: ['請檢查網絡連接', '驗證 URL 格式是否正確'],
      };
      setResult(diagResult);
    } finally {
      setIsTesting(false);
    }
  };

  const handleLoadVideo = () => {
    if (result && result.isValid && onLoadVideo) {
      onLoadVideo(testUrl.trim());
      onClose();
    }
  };

  const getStatusIcon = () => {
    if (!result) return null;

    if (result.isValid && result.errors.length === 0) {
      return <CheckCircle size={48} color="#10b981" />;
    } else if (result.warnings.length > 0 && result.errors.length === 0) {
      return <AlertTriangle size={48} color="#f59e0b" />;
    } else {
      return <XCircle size={48} color="#ef4444" />;
    }
  };

  const getStatusText = () => {
    if (!result) return '';

    if (result.isValid && result.errors.length === 0) {
      if (result.warnings.length === 0) {
        return '✅ 完美！視頻完全兼容';
      }
      return '⚠️ 可播放，但有建議改進項';
    } else {
      return '❌ 無法播放';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <TestTube2 size={24} color={Colors.primary.accent} />
              <Text style={styles.title}>MP4 錯誤診斷器</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.primary.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>視頻 URL</Text>
              <TextInput
                style={styles.input}
                placeholder="輸入 MP4 視頻 URL"
                placeholderTextColor={Colors.primary.textSecondary}
                value={selectedFile ? `本地文件: ${selectedFile}` : testUrl}
                onChangeText={(text) => {
                  setTestUrl(text);
                  setSelectedFile(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                multiline
                editable={!selectedFile}
              />
              {selectedFile && (
                <TouchableOpacity
                  style={styles.clearFileButton}
                  onPress={() => {
                    setSelectedFile(null);
                    setTestUrl('');
                    setResult(null);
                    setPrepareResult(null);
                  }}
                >
                  <Text style={styles.clearFileText}>清除選擇</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.selectFileButton]}
                onPress={handlePickFile}
              >
                <Text style={styles.selectFileButtonText}>📁 選擇影片</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.testButton, isTesting && styles.buttonDisabled]}
                onPress={handleTest}
                disabled={isTesting || !testUrl.trim()}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <TestTube2 size={20} color="#fff" />
                )}
                <Text style={styles.buttonText}>
                  {isTesting ? '診斷中...' : '開始診斷'}
                </Text>
              </TouchableOpacity>
            </View>

            {result && (
              <View style={styles.resultsContainer}>
                <View style={styles.statusContainer}>
                  {getStatusIcon()}
                  <Text style={styles.statusText}>{getStatusText()}</Text>
                </View>

                {result.httpStatus && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>HTTP 狀態</Text>
                    <Text style={styles.infoValue}>{result.httpStatus}</Text>
                  </View>
                )}

                {result.contentType && (
                  <View style={[
                    styles.infoCard,
                    result.mimeTypeIssue && styles.warningCard
                  ]}>
                    <Text style={styles.infoLabel}>Content-Type</Text>
                    <Text style={styles.infoValue}>{result.contentType}</Text>
                    {result.mimeTypeIssue && (
                      <Text style={styles.warningText}>
                        ⚠️ MIME 類型不正確，將自動修正
                      </Text>
                    )}
                  </View>
                )}

                {result.acceptRanges !== undefined && (
                  <View style={[
                    styles.infoCard,
                    !result.acceptRanges && styles.warningCard
                  ]}>
                    <Text style={styles.infoLabel}>Accept-Ranges</Text>
                    <Text style={styles.infoValue}>
                      {result.acceptRanges ? '✅ bytes' : '❌ 不支持'}
                    </Text>
                    {!result.acceptRanges && (
                      <Text style={styles.warningText}>
                        ⚠️ 可能無法快進/拖曳
                      </Text>
                    )}
                  </View>
                )}

                {(result.contentLength || prepareResult?.size) && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>文件大小</Text>
                    <Text style={styles.infoValue}>
                      {result.contentLength 
                        ? (result.contentLength / 1024 / 1024).toFixed(2)
                        : prepareResult?.size
                        ? (prepareResult.size / 1024 / 1024).toFixed(2)
                        : '0.00'
                      } MB
                    </Text>
                  </View>
                )}

                {prepareResult && (
                  <View style={[
                    styles.infoCard,
                    !prepareResult.success && styles.errorCard
                  ]}>
                    <Text style={styles.infoLabel}>本地文件處理</Text>
                    {prepareResult.success ? (
                      <>
                        <Text style={styles.infoValue}>
                          ✅ {prepareResult.needsCopy ? '已複製到快取' : prepareResult.isCached ? '使用已快取文件' : '直接訪問'}
                        </Text>
                        {prepareResult.needsCopy && (
                          <Text style={styles.warningText}>
                            💡 文件已複製到應用快取目錄以確保播放相容性
                          </Text>
                        )}
                      </>
                    ) : (
                      <>
                        <Text style={styles.infoValue}>❌ 準備失敗</Text>
                        <Text style={styles.errorText}>
                          {prepareResult.error}
                        </Text>
                      </>
                    )}
                  </View>
                )}

                {result.corsEnabled !== undefined && (
                  <View style={[
                    styles.infoCard,
                    !result.corsEnabled && styles.errorCard
                  ]}>
                    <Text style={styles.infoLabel}>CORS</Text>
                    <Text style={styles.infoValue}>
                      {result.corsEnabled ? '✅ 已啟用' : '❌ 未配置'}
                    </Text>
                    {!result.corsEnabled && (
                      <Text style={styles.errorText}>
                        ⚠️ CORS 問題可能導致播放失敗
                      </Text>
                    )}
                  </View>
                )}

                {result.corsFallbackTested && (
                  <View style={styles.infoCard}>
                    <Info size={16} color={Colors.warning} />
                    <Text style={styles.warningText}>
                      使用了 no-cors 模式進行測試
                    </Text>
                  </View>
                )}

                {result.errors.length > 0 && (
                  <View style={styles.errorSection}>
                    <Text style={styles.errorSectionTitle}>❌ 錯誤</Text>
                    {result.errors.map((error, index) => (
                      <Text key={index} style={styles.errorItem}>
                        • {error}
                      </Text>
                    ))}
                  </View>
                )}

                {result.warnings.length > 0 && (
                  <View style={styles.warningSection}>
                    <Text style={styles.warningSectionTitle}>⚠️ 警告</Text>
                    {result.warnings.map((warning, index) => (
                      <Text key={index} style={styles.warningItem}>
                        • {warning}
                      </Text>
                    ))}
                  </View>
                )}

                {result.recommendations.length > 0 && (
                  <View style={styles.recommendationSection}>
                    <Text style={styles.recommendationSectionTitle}>
                      💡 建議
                    </Text>
                    {result.recommendations.map((rec, index) => (
                      <Text key={index} style={styles.recommendationItem}>
                        • {rec}
                      </Text>
                    ))}
                  </View>
                )}

                {result.isValid && result.errors.length === 0 && onLoadVideo && (
                  <TouchableOpacity
                    style={styles.loadButton}
                    onPress={handleLoadVideo}
                  >
                    <Text style={styles.buttonText}>載入並播放</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.helpSection}>
              <Text style={styles.helpTitle}>診斷說明</Text>
              <Text style={styles.helpText}>
                此工具會檢查 MP4 視頻的可播放性，包括：
              </Text>
              <Text style={styles.helpItem}>• HTTP 狀態碼</Text>
              <Text style={styles.helpItem}>• Content-Type (MIME 類型)</Text>
              <Text style={styles.helpItem}>• Accept-Ranges (支持快進)</Text>
              <Text style={styles.helpItem}>• CORS 配置</Text>
              <Text style={styles.helpItem}>• 文件大小</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.primary.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary.text,
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.primary.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.card.border,
    minHeight: 60,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  selectFileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary.bg,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary.accent,
  },
  selectFileButtonText: {
    color: Colors.primary.accent,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary.accent,
    paddingVertical: 16,
    borderRadius: 12,
  },
  clearFileButton: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  clearFileText: {
    color: Colors.primary.accent,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  resultsContainer: {
    marginBottom: 20,
  },
  statusContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginTop: 12,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  warningCard: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  errorCard: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary.text,
  },
  warningText: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
  },
  errorSection: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ef4444',
    marginBottom: 8,
  },
  errorItem: {
    fontSize: 13,
    color: '#ef4444',
    marginBottom: 4,
    lineHeight: 18,
  },
  warningSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#f59e0b',
    marginBottom: 8,
  },
  warningItem: {
    fontSize: 13,
    color: '#f59e0b',
    marginBottom: 4,
    lineHeight: 18,
  },
  recommendationSection: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  recommendationSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#10b981',
    marginBottom: 8,
  },
  recommendationItem: {
    fontSize: 13,
    color: '#10b981',
    marginBottom: 4,
    lineHeight: 18,
  },
  loadButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  helpSection: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  helpItem: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    marginLeft: 8,
    lineHeight: 18,
  },
});

export default MP4DiagnosticTool;
