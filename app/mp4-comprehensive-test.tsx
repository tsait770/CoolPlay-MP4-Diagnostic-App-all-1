import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import UniversalVideoPlayer from '@/components/UniversalVideoPlayer';
import { diagnoseMP4Url, formatDiagnosticsReport, type MP4DiagnosticsResult } from '@/utils/mp4Diagnostics';
import { Play, AlertCircle, CheckCircle, XCircle } from 'lucide-react-native';

const TEST_URLS = [
  {
    name: 'Big Buck Bunny (Google)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    description: '720p MP4, well-formed, faststart enabled',
  },
  {
    name: 'Sintel (Google)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    description: '720p MP4, well-formed, faststart enabled',
  },
  {
    name: 'Elephants Dream (Google)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    description: '720p MP4, well-formed, faststart enabled',
  },
];

export default function MP4TestPage() {
  const [customUrl, setCustomUrl] = useState('');
  const [playingUrl, setPlayingUrl] = useState('');
  const [diagnostics, setDiagnostics] = useState<MP4DiagnosticsResult | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const handleTestUrl = useCallback(async (url: string) => {
    console.log('[MP4Test] Testing URL:', url);
    setIsRunningDiagnostics(true);
    setDiagnostics(null);
    setPlaybackError(null);
    
    try {
      const result = await diagnoseMP4Url(url);
      setDiagnostics(result);
      console.log('[MP4Test] Diagnostics complete:', result);
      
      if (result.isValid) {
        console.log('[MP4Test] URL passed diagnostics, loading player');
        setPlayingUrl(url);
      } else {
        console.error('[MP4Test] URL failed diagnostics:', result.errors);
        setPlaybackError(result.errors.join('\\n'));
      }
    } catch (error) {
      console.error('[MP4Test] Diagnostics error:', error);
      setPlaybackError(`Diagnostics failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningDiagnostics(false);
    }
  }, []);

  const handlePlayCustomUrl = useCallback(() => {
    if (!customUrl.trim()) {
      setPlaybackError('Please enter a valid URL');
      return;
    }
    handleTestUrl(customUrl);
  }, [customUrl, handleTestUrl]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'MP4 Player Test',
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        {/* Player Section */}
        <View style={styles.playerSection}>
          {playingUrl ? (
            <View>
              <Text style={styles.playingLabel}>Now Playing:</Text>
              <Text style={styles.playingUrl} numberOfLines={2}>{playingUrl}</Text>
              <View style={styles.playerWrapper}>
                <UniversalVideoPlayer
                  url={playingUrl}
                  autoPlay={true}
                  onError={(error) => {
                    console.error('[MP4Test] Player error:', error);
                    setPlaybackError(error);
                  }}
                  onPlaybackStart={() => {
                    console.log('[MP4Test] Playback started');
                    setPlaybackError(null);
                  }}
                />
              </View>
              <TouchableOpacity
                style={styles.stopButton}
                onPress={() => setPlayingUrl('')}
              >
                <XCircle size={16} color="#fff" />
                <Text style={styles.stopButtonText}>Stop & Clear</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Play size={48} color="#666" />
              <Text style={styles.placeholderText}>Select a test video or enter a custom URL</Text>
            </View>
          )}
        </View>

        {/* Error Display */}
        {playbackError && (
          <View style={styles.errorBox}>
            <AlertCircle size={20} color="#ef4444" />
            <Text style={styles.errorText}>{playbackError}</Text>
          </View>
        )}

        {/* Diagnostics Display */}
        {diagnostics && (
          <View style={styles.diagnosticsContainer}>
            <View style={styles.diagnosticsHeader}>
              {diagnostics.isValid ? (
                <CheckCircle size={20} color="#10b981" />
              ) : (
                <XCircle size={20} color="#ef4444" />
              )}
              <Text style={styles.diagnosticsTitle}>
                {diagnostics.isValid ? 'Diagnostics Passed' : 'Diagnostics Failed'}
              </Text>
            </View>
            <ScrollView style={styles.diagnosticsScroll} nestedScrollEnabled>
              <Text style={styles.diagnosticsText}>{formatDiagnosticsReport(diagnostics)}</Text>
            </ScrollView>
          </View>
        )}

        {/* Custom URL Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom URL Test</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter MP4 URL..."
              placeholderTextColor="#666"
              value={customUrl}
              onChangeText={setCustomUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity
              style={[styles.testButton, (!customUrl.trim() || isRunningDiagnostics) && styles.testButtonDisabled]}
              onPress={handlePlayCustomUrl}
              disabled={!customUrl.trim() || isRunningDiagnostics}
            >
              <Play size={16} color="#fff" />
              <Text style={styles.testButtonText}>
                {isRunningDiagnostics ? 'Testing...' : 'Test'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Test URLs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sample Test Videos</Text>
          {TEST_URLS.map((testUrl, index) => (
            <TouchableOpacity
              key={index}
              style={styles.testUrlCard}
              onPress={() => handleTestUrl(testUrl.url)}
              disabled={isRunningDiagnostics}
            >
              <View style={styles.testUrlHeader}>
                <Text style={styles.testUrlName}>{testUrl.name}</Text>
                {isRunningDiagnostics && <Text style={styles.testingLabel}>Testing...</Text>}
              </View>
              <Text style={styles.testUrlDescription}>{testUrl.description}</Text>
              <Text style={styles.testUrlUrl} numberOfLines={1}>{testUrl.url}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Platform Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Information</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Platform" value={Platform.OS} />
            <InfoRow label="Version" value={Platform.Version.toString()} />
            <InfoRow label="React Native" value="Expo" />
            <InfoRow label="Video Player" value="expo-video (native + WebView fallback)" />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testing Instructions</Text>
          <View style={styles.infoCard}>
            <Text style={styles.instructionText}>
              1. Click on a sample video to test{'\n'}
              2. Or enter a custom MP4 URL above{'\n'}
              3. Check diagnostics for server headers{'\n'}
              4. Monitor player logs in console{'\n'}
              5. Report any errors with diagnostics info
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  playerSection: {
    backgroundColor: '#111',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  playingLabel: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  playingUrl: {
    color: '#666',
    fontSize: 11,
    marginBottom: 12,
  },
  playerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  placeholderContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#1a0f0f',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 13,
    lineHeight: 18,
  },
  diagnosticsContainer: {
    backgroundColor: '#0f1a0f',
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
    overflow: 'hidden',
  },
  diagnosticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: '#10b981',
  },
  diagnosticsTitle: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  diagnosticsScroll: {
    maxHeight: 200,
  },
  diagnosticsText: {
    color: '#10b981',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    padding: 12,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  testButtonDisabled: {
    opacity: 0.5,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  testUrlCard: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  testUrlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  testUrlName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  testingLabel: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600' as const,
  },
  testUrlDescription: {
    color: '#999',
    fontSize: 12,
    marginBottom: 6,
  },
  testUrlUrl: {
    color: '#666',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  infoLabel: {
    color: '#999',
    fontSize: 13,
  },
  infoValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500' as const,
  },
  instructionText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
  },
});
