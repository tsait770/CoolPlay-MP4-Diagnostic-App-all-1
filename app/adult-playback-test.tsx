import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UniversalVideoPlayer from '@/components/UniversalVideoPlayer';
import { detectVideoSource } from '@/utils/videoSourceDetector';
import Colors from '@/constants/colors';
import { Play, AlertCircle } from 'lucide-react-native';

const TEST_URLS = [
  {
    name: 'Pornhub CN (Your URL)',
    url: 'https://cn.pornhub.com/view_video.php?viewkey=655f3bc832793',
    category: 'Adult',
  },
  {
    name: 'Pornhub EN',
    url: 'https://www.pornhub.com/view_video.php?viewkey=ph5d7b73a7b7c7e',
    category: 'Adult',
  },
  {
    name: 'YouTube (Control)',
    url: 'https://youtu.be/DzVKgumDkpo',
    category: 'Mainstream',
  },
];

export default function AdultPlaybackTestScreen() {
  const insets = useSafeAreaInsets();
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [showPlayer, setShowPlayer] = useState(false);

  const handleTestUrl = (url: string) => {
    console.log('[AdultPlaybackTest] Testing URL:', url);
    const sourceInfo = detectVideoSource(url);
    console.log('[AdultPlaybackTest] Source info:', sourceInfo);
    
    setSelectedUrl(url);
    setShowPlayer(true);
    setTestResults(prev => ({
      ...prev,
      [url]: 'Testing...',
    }));
  };

  const handlePlayerError = (url: string, error: string) => {
    console.error('[AdultPlaybackTest] Player error for', url, ':', error);
    setTestResults(prev => ({
      ...prev,
      [url]: `❌ Failed: ${error}`,
    }));
  };

  const handlePlayerSuccess = (url: string) => {
    console.log('[AdultPlaybackTest] Player success for', url);
    setTestResults(prev => ({
      ...prev,
      [url]: '✅ Loaded successfully',
    }));
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Adult Content Playback Test',
          headerStyle: { backgroundColor: Colors.secondary.bg },
          headerTintColor: Colors.primary.text,
        }}
      />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: 16, paddingBottom: insets.bottom + 20 }]}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <AlertCircle size={24} color={Colors.accent.primary} />
          <Text style={styles.infoTitle}>Adult Playback Test</Text>
          <Text style={styles.infoText}>
            Testing adult platform playback with WebView. This tests the Chinese Pornhub domain and other adult platforms.
          </Text>
        </View>

        {/* Test URLs */}
        <Text style={styles.sectionTitle}>Test URLs</Text>
        {TEST_URLS.map((test, index) => {
          const sourceInfo = detectVideoSource(test.url);
          const result = testResults[test.url];
          
          return (
            <View key={index} style={styles.testCard}>
              <View style={styles.testHeader}>
                <Text style={styles.testName}>{test.name}</Text>
                <Text style={[
                  styles.testCategory,
                  test.category === 'Adult' && styles.testCategoryAdult
                ]}>
                  {test.category}
                </Text>
              </View>
              
              <Text style={styles.testUrl} numberOfLines={1}>{test.url}</Text>
              
              <View style={styles.testInfo}>
                <Text style={styles.testInfoLabel}>Platform:</Text>
                <Text style={styles.testInfoValue}>{sourceInfo.platform}</Text>
              </View>
              
              <View style={styles.testInfo}>
                <Text style={styles.testInfoLabel}>Type:</Text>
                <Text style={styles.testInfoValue}>{sourceInfo.type}</Text>
              </View>
              
              <View style={styles.testInfo}>
                <Text style={styles.testInfoLabel}>Requires WebView:</Text>
                <Text style={styles.testInfoValue}>
                  {sourceInfo.requiresWebView ? '✅ Yes' : '❌ No'}
                </Text>
              </View>
              
              {result && (
                <View style={[
                  styles.resultBadge,
                  result.includes('✅') && styles.resultSuccess,
                  result.includes('❌') && styles.resultError,
                ]}>
                  <Text style={styles.resultText}>{result}</Text>
                </View>
              )}
              
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => handleTestUrl(test.url)}
              >
                <Play size={16} color="#fff" />
                <Text style={styles.testButtonText}>Test Playback</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Custom URL Test */}
        <Text style={styles.sectionTitle}>Custom URL Test</Text>
        <View style={styles.customUrlCard}>
          <TextInput
            style={styles.customUrlInput}
            placeholder="Enter adult content URL..."
            placeholderTextColor={Colors.primary.textSecondary}
            value={customUrl}
            onChangeText={setCustomUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity
            style={[styles.testButton, !customUrl.trim() && styles.testButtonDisabled]}
            onPress={() => customUrl.trim() && handleTestUrl(customUrl.trim())}
            disabled={!customUrl.trim()}
          >
            <Play size={16} color="#fff" />
            <Text style={styles.testButtonText}>Test Custom URL</Text>
          </TouchableOpacity>
        </View>

        {/* Player Container */}
        {showPlayer && selectedUrl && (
          <View style={styles.playerSection}>
            <Text style={styles.sectionTitle}>Player Output</Text>
            <View style={styles.playerCard}>
              <Text style={styles.playerUrlLabel}>Testing:</Text>
              <Text style={styles.playerUrl} numberOfLines={2}>{selectedUrl}</Text>
              
              <View style={styles.playerContainer}>
                <UniversalVideoPlayer
                  url={selectedUrl}
                  onError={(error) => handlePlayerError(selectedUrl, error)}
                  onPlaybackStart={() => handlePlayerSuccess(selectedUrl)}
                  autoPlay={false}
                  loadTimeout={45000}
                  maxRetries={3}
                />
              </View>
            </View>
          </View>
        )}

        {/* Platform Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>🔍 Testing Notes</Text>
          <Text style={styles.notesText}>
            • Chinese domains (cn.pornhub.com) now supported{'\n'}
            • WebView with optimized headers for adult sites{'\n'}
            • Auto-retry on failure (max 3 attempts){'\n'}
            • 45-second load timeout{'\n'}
            • Platform: {Platform.OS}{'\n'}
            • Age verification required for adult content
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  content: {
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: Colors.accent.primary + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent.primary + '30',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary.text,
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 12,
    marginTop: 8,
  },
  testCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
    flex: 1,
  },
  testCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent.primary,
    backgroundColor: Colors.accent.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  testCategoryAdult: {
    color: '#FF6B6B',
    backgroundColor: '#FF6B6B15',
  },
  testUrl: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  testInfo: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  testInfoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary.textSecondary,
    width: 120,
  },
  testInfoValue: {
    fontSize: 13,
    color: Colors.primary.text,
    flex: 1,
  },
  resultBadge: {
    backgroundColor: Colors.card.bg,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  resultSuccess: {
    backgroundColor: '#4CAF5015',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  resultError: {
    backgroundColor: '#FF6B6B15',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  resultText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary.text,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  testButtonDisabled: {
    opacity: 0.5,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  customUrlCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  customUrlInput: {
    backgroundColor: Colors.card.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: Colors.primary.text,
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  playerSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  playerCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  playerUrlLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary.textSecondary,
    marginBottom: 4,
  },
  playerUrl: {
    fontSize: 12,
    color: Colors.primary.text,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  notesCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  notesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
  },
});
