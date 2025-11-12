import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Stack } from 'expo-router';

import * as DocumentPicker from 'expo-document-picker';
import { MP4Player } from '@/components/MP4Player';
import { Play, FileVideo, CheckCircle, XCircle, Info } from 'lucide-react-native';

export default function LocalMP4TestScreen() {
  const [videoUri, setVideoUri] = useState<string>('');
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const pickVideo = async () => {
    try {
      setError(null);
      console.log('[LocalMP4Test] ========== File Picker Started ==========');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/mp4', 'video/quicktime', 'video/*'],
        copyToCacheDirectory: true,
      });

      console.log('[LocalMP4Test] Picker result:', {
        canceled: result.canceled,
        assets: result.assets?.length || 0,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('[LocalMP4Test] Selected file:', {
          name: file.name,
          uri: file.uri,
          size: file.size,
          mimeType: file.mimeType,
        });

        setVideoUri(file.uri);
        setFileInfo({
          name: file.name,
          size: file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
        });
        setIsPlaying(false);
        setError(null);

        console.log('[LocalMP4Test] ✅ File selected successfully');
      } else {
        console.log('[LocalMP4Test] File picker canceled');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[LocalMP4Test] ❌ Error picking file:', errorMsg);
      setError(`Failed to pick file: ${errorMsg}`);
    }
  };

  const handlePlaybackStart = () => {
    console.log('[LocalMP4Test] 🎬 Playback started');
    setIsPlaying(true);
  };

  const handleError = (errorMsg: string) => {
    console.error('[LocalMP4Test] ❌ Playback error:', errorMsg);
    setError(errorMsg);
    setIsPlaying(false);
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Local MP4 Test',
        headerShown: true,
      }} />
      
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Info */}
          <View style={styles.infoCard}>
            <Info size={24} color="#3b82f6" />
            <Text style={styles.infoTitle}>Local MP4 Playback Test</Text>
            <Text style={styles.infoText}>
              This test validates the new local MP4 file playback system with:
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>✓ Expo FileSystem v54 (new API)</Text>
              <Text style={styles.featureItem}>✓ Simplified useLocalVideoPlayer hook</Text>
              <Text style={styles.featureItem}>✓ Automatic iOS file cache copying</Text>
              <Text style={styles.featureItem}>✓ Android local file support</Text>
              <Text style={styles.featureItem}>✓ expo-video player integration</Text>
            </View>
          </View>

          {/* File Picker Button */}
          <TouchableOpacity 
            style={styles.pickerButton}
            onPress={pickVideo}
            activeOpacity={0.8}
          >
            <FileVideo size={24} color="#ffffff" />
            <Text style={styles.pickerButtonText}>
              {videoUri ? 'Change Video File' : 'Select MP4 File'}
            </Text>
          </TouchableOpacity>

          {/* File Info Display */}
          {fileInfo && (
            <View style={styles.fileInfoCard}>
              <View style={styles.fileInfoHeader}>
                <CheckCircle size={20} color="#10b981" />
                <Text style={styles.fileInfoTitle}>Selected File</Text>
              </View>
              <Text style={styles.fileName}>{fileInfo.name}</Text>
              <Text style={styles.fileSize}>Size: {fileInfo.size}</Text>
              <Text style={styles.filePlatform}>Platform: {Platform.OS}</Text>
            </View>
          )}

          {/* Video Player */}
          {videoUri && (
            <View style={styles.playerContainer}>
              <MP4Player
                uri={videoUri}
                autoPlay={false}
                onPlaybackStart={handlePlaybackStart}
                onError={handleError}
                style={styles.player}
              />
              {isPlaying && (
                <View style={styles.playingIndicator}>
                  <Play size={16} color="#10b981" />
                  <Text style={styles.playingText}>Playing</Text>
                </View>
              )}
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View style={styles.errorCard}>
              <View style={styles.errorHeader}>
                <XCircle size={20} color="#ef4444" />
                <Text style={styles.errorTitle}>Error</Text>
              </View>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Testing Instructions</Text>
            <View style={styles.instructionsList}>
              <Text style={styles.instructionItem}>
                1. Tap &ldquo;Select MP4 File&rdquo; to choose a local video file
              </Text>
              <Text style={styles.instructionItem}>
                2. The app will automatically prepare the file for playback
              </Text>
              <Text style={styles.instructionItem}>
                3. On iOS, files are copied to cache directory
              </Text>
              <Text style={styles.instructionItem}>
                4. On Android, files are accessed directly when possible
              </Text>
              <Text style={styles.instructionItem}>
                5. Use native video controls to play/pause
              </Text>
            </View>
          </View>

          {/* Platform-Specific Notes */}
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Platform Notes</Text>
            {Platform.OS === 'ios' && (
              <View style={styles.notesList}>
                <Text style={styles.noteItem}>
                  • iOS security requires files to be copied to app cache
                </Text>
                <Text style={styles.noteItem}>
                  • DocumentPicker automatically copies to cache directory
                </Text>
                <Text style={styles.noteItem}>
                  • videoHelpers validates and prepares files for playback
                </Text>
              </View>
            )}
            {Platform.OS === 'android' && (
              <View style={styles.notesList}>
                <Text style={styles.noteItem}>
                  • Android can access files directly in most cases
                </Text>
                <Text style={styles.noteItem}>
                  • content:// URIs are automatically handled
                </Text>
                <Text style={styles.noteItem}>
                  • Falls back to cache copy if direct access fails
                </Text>
              </View>
            )}
            {Platform.OS === 'web' && (
              <View style={styles.notesList}>
                <Text style={styles.noteItem}>
                  • Web platform uses File API
                </Text>
                <Text style={styles.noteItem}>
                  • No special handling required
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#f1f5f9',
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  featureList: {
    gap: 8,
    marginTop: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#10b981',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  fileInfoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  fileInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  fileInfoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#10b981',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#f1f5f9',
  },
  fileSize: {
    fontSize: 12,
    color: '#94a3b8',
  },
  filePlatform: {
    fontSize: 12,
    color: '#94a3b8',
  },
  playerContainer: {
    gap: 12,
  },
  player: {
    borderRadius: 16,
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    alignSelf: 'center',
  },
  playingText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#10b981',
  },
  errorCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#fca5a5',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  instructionsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#f1f5f9',
  },
  instructionsList: {
    gap: 8,
  },
  instructionItem: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  notesCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 40,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#f59e0b',
  },
  notesList: {
    gap: 8,
  },
  noteItem: {
    fontSize: 13,
    color: '#fbbf24',
    lineHeight: 20,
  },
});
