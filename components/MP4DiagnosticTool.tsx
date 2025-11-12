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
  type MP4DiagnosticsResult,
} from '../utils/mp4Diagnostics';
import { prepareLocalVideo, type PrepareLocalVideoResult } from '../utils/videoHelpers';
import Colors from '../constants/colors';

type DiagnosticSource = 'local' | 'remote';

type DiagnosticTarget = {
  uri: string;
  source: DiagnosticSource;
  originalUri?: string;
  displayName?: string;
};

type ActiveMediaState = {
  source: DiagnosticSource;
  originalUri: string;
  resolvedUri?: string;
  displayName?: string;
  size?: number;
};

type SelectedFileInfo = {
  name: string;
  uri: string;
  size?: number;
  mimeType?: string | null;
};

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
  onLoadVideo,
}: MP4DiagnosticToolProps) {
  const [testUrl, setTestUrl] = useState(initialUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<MP4DiagnosticsResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFileInfo | null>(null);
  const [prepareResult, setPrepareResult] = useState<PrepareLocalVideoResult | null>(null);
  const [activeMedia, setActiveMedia] = useState<ActiveMediaState | null>(null);
  const [diagnosticPayload, setDiagnosticPayload] = useState<Record<string, unknown> | null>(null);
  const diagnosticLines = React.useMemo(() => {
    if (!diagnosticPayload) {
      return [] as string[];
    }
    return JSON.stringify(diagnosticPayload, null, 2).split('\n');
  }, [diagnosticPayload]);

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    const trimmedInitial = initialUrl.trim();

    if (trimmedInitial.length === 0) {
      return;
    }

    setSelectedFile(null);
    setPrepareResult(null);
    setActiveMedia((prev) => {
      if (prev?.originalUri === trimmedInitial && prev.source === 'remote') {
        return prev;
      }
      return {
        source: 'remote',
        originalUri: trimmedInitial,
        resolvedUri: trimmedInitial,
      };
    });

    setTestUrl((current) => {
      if (current.trim() === trimmedInitial) {
        return current;
      }
      return trimmedInitial;
    });
  }, [visible, initialUrl]);

  const handleTest = React.useCallback(async (override?: DiagnosticTarget) => {
    const rawInput = override?.uri ?? selectedFile?.uri ?? testUrl;
    const trimmedInput = typeof rawInput === 'string' ? rawInput.trim() : '';
    const source: DiagnosticSource = override?.source ?? (selectedFile ? 'local' : 'remote');
    const displayName = override?.displayName ?? selectedFile?.name;
    const originalUri = override?.originalUri ?? selectedFile?.uri ?? testUrl;
    const hasValidInput = trimmedInput.length > 0;

    console.log('[MP4DiagnosticTool] ========== Starting Test ==========');
    console.log('[MP4DiagnosticTool] override:', override);
    console.log('[MP4DiagnosticTool] rawInput:', rawInput);
    console.log('[MP4DiagnosticTool] trimmedInput:', trimmedInput);
    console.log('[MP4DiagnosticTool] selectedFile:', selectedFile);
    console.log('[MP4DiagnosticTool] source:', source);

    if (!hasValidInput) {
      console.error('[MP4DiagnosticTool] ❌ No URL or file selected');
      console.error('[MP4DiagnosticTool] testUrl:', testUrl);
      console.error('[MP4DiagnosticTool] selectedFile:', selectedFile);
      Alert.alert('錯誤', '請先選擇影片文件或輸入視頻 URL');
      return;
    }

    setIsTesting(true);
    setResult(null);
    setPrepareResult(null);
    setDiagnosticPayload(null);
    setActiveMedia({
      source,
      originalUri: typeof originalUri === 'string' ? originalUri.trim() : trimmedInput,
      resolvedUri: trimmedInput,
      displayName,
      size: selectedFile?.size,
    });

    try {
      const isLocalFile =
        source === 'local' ||
        trimmedInput.startsWith('file://') ||
        trimmedInput.startsWith('content://') ||
        trimmedInput.startsWith('ph://') ||
        trimmedInput.startsWith('assets-library://');

      if (isLocalFile) {
        console.log('[MP4DiagnosticTool] Local file detected, preparing...');
        const prepResult = await prepareLocalVideo(trimmedInput);
        setPrepareResult(prepResult);
        console.log('[MP4DiagnosticTool] Prepare result:', prepResult);

        if (prepResult.success && prepResult.uri) {
          const resolvedUri = prepResult.uri;
          setTestUrl(resolvedUri);
          setActiveMedia({
            source: 'local',
            originalUri: prepResult.originUri,
            resolvedUri,
            displayName: prepResult.displayName ?? displayName ?? selectedFile?.name,
            size: prepResult.size,
          });

          const diagResult: MP4DiagnosticsResult = {
            isValid: true,
            url: resolvedUri,
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
              name: prepResult.displayName ?? displayName ?? trimmedInput.split('/').pop() ?? 'Unknown',
              size: prepResult.size,
              uri: resolvedUri,
            },
          };

          setResult(diagResult);
          const payload = {
            event: 'diagnostic.finish',
            timestamp: new Date().toISOString(),
            source: 'local',
            fileName: diagResult.fileInfo?.name,
            path: prepResult.originUri,
            resolvedUri,
            size: prepResult.size,
            platform: prepResult.platform,
            needsCopy: prepResult.needsCopy,
            isCached: prepResult.isCached,
            status: 'playable',
          };
          setDiagnosticPayload(payload);
          console.log('[MP4DiagnosticTool] Diagnostic payload:', payload);

          console.log('[MP4DiagnosticTool] Local file diagnostic complete:', diagResult);
        } else {
          const errorMessage = prepResult.error ?? 'Failed to prepare local file';
          const diagResult: MP4DiagnosticsResult = {
            isValid: false,
            url: trimmedInput,
            isLocalFile: true,
            errors: [errorMessage],
            warnings: [],
            recommendations: [
              '請確保應用有權限讀取該文件',
              '檢查儲存空間是否充足',
              '嘗試重新選擇文件',
            ],
          };

          setResult(diagResult);
          const payload = {
            event: 'diagnostic.finish',
            timestamp: new Date().toISOString(),
            source: 'local',
            path: trimmedInput,
            status: 'failed',
            error: errorMessage,
          };
          setDiagnosticPayload(payload);
          console.log('[MP4DiagnosticTool] Diagnostic payload:', payload);
        }
      } else {
        const diagResult = await diagnoseMP4Url(trimmedInput);
        setResult(diagResult);
        setActiveMedia({
          source: 'remote',
          originalUri: typeof originalUri === 'string' ? originalUri.trim() : trimmedInput,
          resolvedUri: diagResult.url?.trim() ?? trimmedInput,
          displayName,
        });

        const payload = {
          event: 'diagnostic.finish',
          timestamp: new Date().toISOString(),
          source: 'remote',
          url: diagResult.url,
          httpStatus: diagResult.httpStatus,
          contentType: diagResult.contentType,
          acceptRanges: diagResult.acceptRanges,
          corsEnabled: diagResult.corsEnabled,
          warnings: diagResult.warnings,
          errors: diagResult.errors,
          recommendations: diagResult.recommendations,
          status: diagResult.isValid && diagResult.errors.length === 0 ? 'playable' : 'failed',
        };
        setDiagnosticPayload(payload);
        console.log('[MP4DiagnosticTool] Diagnostic payload:', payload);

        console.log('[MP4DiagnosticTool] Diagnostic complete:', diagResult);
      }
    } catch (error) {
      console.error('[MP4DiagnosticTool] Test failed:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      const diagResult: MP4DiagnosticsResult = {
        isValid: false,
        url: trimmedInput,
        errors: [errorMsg],
        warnings: [],
        recommendations: ['請檢查網絡連接', '驗證 URL 格式是否正確'],
        isLocalFile: source === 'local',
      };
      setResult(diagResult);
      const payload = {
        event: 'diagnostic.finish',
        timestamp: new Date().toISOString(),
        source,
        status: 'failed',
        error: errorMsg,
        uri: trimmedInput,
      };
      setDiagnosticPayload(payload);
      console.log('[MP4DiagnosticTool] Diagnostic payload:', payload);
    } finally {
      setIsTesting(false);
    }
  }, [selectedFile, testUrl]);

  const handlePickFile = async () => {
    try {
      console.log('[MP4DiagnosticTool] Opening document picker...');

      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: ['video/mp4', 'video/*'],
        copyToCacheDirectory: Platform.OS === 'ios',
      });

      console.log('[MP4DiagnosticTool] Document picker result:', {
        canceled: pickerResult.canceled,
        assets: pickerResult.assets?.length || 0,
      });

      if (pickerResult.canceled) {
        return;
      }

      const file = pickerResult.assets?.[0];

      if (file && typeof file.uri === 'string' && file.uri.trim().length > 0) {
        const fileInfo: SelectedFileInfo = {
          name: file.name ?? 'Local Video',
          uri: file.uri,
          size: file.size,
          mimeType: file.mimeType ?? null,
        };

        console.log('[MP4DiagnosticTool] ========== File Selected ==========');
        console.log('[MP4DiagnosticTool] Name:', fileInfo.name);
        console.log('[MP4DiagnosticTool] URI:', fileInfo.uri);
        console.log('[MP4DiagnosticTool] Size:', fileInfo.size, 'bytes');
        console.log('[MP4DiagnosticTool] MIME type:', fileInfo.mimeType);
        console.log('[MP4DiagnosticTool] Platform:', Platform.OS);

        setSelectedFile(fileInfo);
        setTestUrl(fileInfo.uri);
        setActiveMedia({
          source: 'local',
          originalUri: fileInfo.uri,
          resolvedUri: fileInfo.uri,
          displayName: fileInfo.name,
          size: fileInfo.size,
        });

        console.log('[MP4DiagnosticTool] ✅ File info stored:', fileInfo);

        setTimeout(() => {
          void handleTest({
            uri: fileInfo.uri,
            source: 'local',
            originalUri: fileInfo.uri,
            displayName: fileInfo.name,
          });
        }, 120);
      } else {
        console.error('[MP4DiagnosticTool] ❌ Invalid file selection payload');
        Alert.alert('錯誤', '無法讀取所選文件');
      }
    } catch (error) {
      console.error('[MP4DiagnosticTool] File picker error:', error);
      console.error('[MP4DiagnosticTool] ❌ 無法選擇文件:', error instanceof Error ? error.message : String(error));
      Alert.alert('錯誤', '選取影片時發生錯誤');
    }
  };

  const handleLoadVideo = () => {
    if (result && result.isValid && onLoadVideo) {
      const resolvedFromState = typeof activeMedia?.resolvedUri === 'string' ? activeMedia.resolvedUri.trim() : '';
      const preparedUri = prepareResult?.success && typeof prepareResult.uri === 'string' ? prepareResult.uri.trim() : '';
      const fallbackRaw = selectedFile?.uri ?? testUrl;
      const fallbackUri = typeof fallbackRaw === 'string' ? fallbackRaw.trim() : '';
      const uriToLoad = resolvedFromState.length > 0 ? resolvedFromState : preparedUri.length > 0 ? preparedUri : fallbackUri;

      console.log('[MP4DiagnosticTool] ========== Loading Video ==========');
      console.log('[MP4DiagnosticTool] activeMedia:', activeMedia);
      console.log('[MP4DiagnosticTool] prepareResult:', prepareResult);
      console.log('[MP4DiagnosticTool] diagnosticPayload:', diagnosticPayload);
      console.log('[MP4DiagnosticTool] fallbackUri:', fallbackUri);
      console.log('[MP4DiagnosticTool] uriToLoad:', uriToLoad);

      if (uriToLoad.length === 0) {
        console.error('[MP4DiagnosticTool] ❌ Empty URI - cannot load video');
        Alert.alert('錯誤', '無法載入影片：URI 為空');
        return;
      }

      console.log('[MP4DiagnosticTool] ✅ Calling onLoadVideo with URI:', uriToLoad);
      onLoadVideo(uriToLoad);
      onClose();
      return;
    }

    console.error('[MP4DiagnosticTool] ❌ Cannot load video:', {
      hasResult: !!result,
      isValid: result?.isValid,
      hasCallback: !!onLoadVideo,
    });
  };

  const getStatusIcon = () => {
    if (!result) return null;

    if (result.isValid && result.errors.length === 0) {
      return <CheckCircle size={48} color="#10b981" />;
    }
    if (result.warnings.length > 0 && result.errors.length === 0) {
      return <AlertTriangle size={48} color="#f59e0b" />;
    }
    return <XCircle size={48} color="#ef4444" />;
  };

  const getStatusText = () => {
    if (!result) return '';

    if (result.isValid && result.errors.length === 0) {
      if (result.warnings.length === 0) {
        return '✅ 完美！視頻完全兼容';
      }
      return '⚠️ 可播放，但有建議改進項';
    }
    return '❌ 無法播放';
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
                testID="mp4-diagnostic-url-input"
                style={styles.input}
                placeholder="輸入 MP4 視頻 URL"
                placeholderTextColor={Colors.primary.textSecondary}
                value={selectedFile ? `本地文件: ${selectedFile.name}` : testUrl}
                onChangeText={(text) => {
                  setTestUrl(text);
                  setSelectedFile(null);
                  setActiveMedia((prev) => (prev?.source === 'remote' ? prev : null));
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
                    setActiveMedia(null);
                    setDiagnosticPayload(null);
                  }}
                >
                  <Text style={styles.clearFileText}>清除選擇</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                testID="mp4-diagnostic-select-file-button"
                style={[styles.selectFileButton]}
                onPress={handlePickFile}
              >
                <Text style={styles.selectFileButtonText}>📁 選擇影片</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="mp4-diagnostic-start-button"
                style={[
                  styles.testButton,
                  (isTesting || (!selectedFile && !testUrl.trim())) && styles.buttonDisabled,
                ]}
                onPress={() => {
                  void handleTest();
                }}
                disabled={isTesting || (!selectedFile && !testUrl.trim())}
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
                  <View
                    style={[
                      styles.infoCard,
                      result.mimeTypeIssue && styles.warningCard,
                    ]}
                  >
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
                  <View
                    style={[
                      styles.infoCard,
                      !result.acceptRanges && styles.warningCard,
                    ]}
                  >
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
                        : '0.00'} MB
                    </Text>
                  </View>
                )}

                {diagnosticLines.length > 0 && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>診斷摘要</Text>
                    <View style={styles.jsonContainer}>
                      {diagnosticLines.map((line, index) => (
                        <Text key={`diagnostic-line-${index}`} style={styles.jsonLineText}>
                          {line}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

                {prepareResult && (
                  <View
                    style={[
                      styles.infoCard,
                      !prepareResult.success && styles.errorCard,
                    ]}
                  >
                    <Text style={styles.infoLabel}>本地文件處理</Text>
                    {prepareResult.success ? (
                      <>
                        <Text style={styles.infoValue}>
                          ✅ {prepareResult.needsCopy
                            ? '已複製到快取'
                            : prepareResult.isCached
                            ? '使用已快取文件'
                            : '直接訪問'}
                        </Text>
                        {prepareResult.displayName && (
                          <Text style={styles.infoDetail}>
                            🎞️ {prepareResult.displayName}
                          </Text>
                        )}
                        {prepareResult.uri && (
                          <Text style={styles.infoDetail} numberOfLines={2}>
                            📁 {prepareResult.uri}
                          </Text>
                        )}
                        {prepareResult.needsCopy && (
                          <Text style={styles.warningText}>
                            💡 文件已複製到應用快取目錄以確保播放相容性
                          </Text>
                        )}
                      </>
                    ) : (
                      <>
                        <Text style={styles.infoValue}>❌ 準備失敗</Text>
                        <Text style={styles.errorText}>{prepareResult.error}</Text>
                      </>
                    )}
                  </View>
                )}

                {result.corsEnabled !== undefined && (
                  <View
                    style={[
                      styles.infoCard,
                      !result.corsEnabled && styles.errorCard,
                    ]}
                  >
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
                    <Text style={styles.warningText}>使用了 no-cors 模式進行測試</Text>
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
                    <Text style={styles.recommendationSectionTitle}>💡 建議</Text>
                    {result.recommendations.map((rec, index) => (
                      <Text key={index} style={styles.recommendationItem}>
                        • {rec}
                      </Text>
                    ))}
                  </View>
                )}

                {result.isValid && result.errors.length === 0 && onLoadVideo && (
                  <TouchableOpacity
                    testID="mp4-diagnostic-load-button"
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
              <Text style={styles.helpText}>此工具會檢查 MP4 視頻的可播放性，包括：</Text>
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
  infoDetail: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginTop: 6,
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
  jsonContainer: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    gap: 4,
  },
  jsonLineText: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
});

export default MP4DiagnosticTool;
