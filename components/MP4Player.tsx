import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { convertToPlayableUrl } from '@/utils/videoSourceDetector';
import { diagnoseMP4Url, formatDiagnosticsReport, type MP4DiagnosticsResult } from '@/utils/mp4Diagnostics';

export interface MP4PlayerProps {
  uri: string;
  onError?: (error: string) => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  autoPlay?: boolean;
  style?: any;
  onBackPress?: () => void;
}

export function MP4Player({ 
  uri, 
  onError, 
  onPlaybackStart, 
  onPlaybackEnd, 
  autoPlay = false, 
  style,
  onBackPress 
}: MP4PlayerProps) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [diagnostics, setDiagnostics] = useState<MP4DiagnosticsResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [processedLocalUri, setProcessedLocalUri] = useState<string | null>(null);
  const [isCopyingFile, setIsCopyingFile] = useState(false);
  const videoRef = useRef<VideoView>(null);
  const maxRetries = 2;

  // Check if this is a local file
  const isLocalFile = React.useMemo(() => {
    return uri.startsWith('file://') || 
           uri.startsWith('content://') || 
           uri.startsWith('ph://') ||
           uri.startsWith('assets-library://');
  }, [uri]);

  // iOS: Copy local file to cache directory for playback
  useEffect(() => {
    if (!isLocalFile || Platform.OS !== 'ios') {
      return;
    }

    const copyLocalFileToCache = async () => {
      try {
        setIsCopyingFile(true);
        console.log('[MP4Player] ========== iOS Local File Processing ==========');
        console.log('[MP4Player] Original URI:', uri);

        // Extract filename
        const filename = uri.split('/').pop() || `video_${Date.now()}.mp4`;
        const cacheDir = FileSystem.cacheDirectory || '';
        if (!cacheDir) {
          throw new Error('Cache directory not available');
        }
        const cacheUri = `${cacheDir}${filename}`;
        
        console.log('[MP4Player] Cache URI:', cacheUri);

        // Check if file already exists in cache
        const cacheFileInfo = await FileSystem.getInfoAsync(cacheUri);
        if (cacheFileInfo.exists) {
          console.log('[MP4Player] ✅ File already exists in cache, using cached version');
          setProcessedLocalUri(cacheUri);
          setIsCopyingFile(false);
          return;
        }

        // Copy file to cache directory
        console.log('[MP4Player] 📋 Copying file to cache directory...');
        await FileSystem.copyAsync({
          from: uri,
          to: cacheUri,
        });

        // Verify copy success
        const copiedFileInfo = await FileSystem.getInfoAsync(cacheUri);
        if (copiedFileInfo.exists) {
          console.log('[MP4Player] ✅ File successfully copied to cache');
          console.log('[MP4Player] File size:', copiedFileInfo.size, 'bytes');
          setProcessedLocalUri(cacheUri);
        } else {
          throw new Error('Failed to verify copied file');
        }
      } catch (error) {
        console.error('[MP4Player] ❌ Failed to copy file to cache:', error);
        console.error('[MP4Player] Error details:', {
          message: error instanceof Error ? error.message : String(error),
          uri,
          platform: Platform.OS,
        });
        
        // Fallback: try to use original URI
        console.log('[MP4Player] ⚠️ Attempting fallback to original URI...');
        setProcessedLocalUri(uri);
      } finally {
        setIsCopyingFile(false);
      }
    };

    copyLocalFileToCache();
  }, [uri, isLocalFile]);

  const processedUri = React.useMemo(() => {
    if (!uri || uri.trim() === '') {
      return '';
    }

    // For iOS local files, use processed cache URI
    if (isLocalFile && Platform.OS === 'ios') {
      if (processedLocalUri) {
        console.log('[MP4Player] ========== iOS Local File (Cached) ==========');
        console.log('[MP4Player] Using cached URI:', processedLocalUri);
        return processedLocalUri;
      } else if (!isCopyingFile) {
        console.log('[MP4Player] ⏳ Waiting for file to be copied to cache...');
        return '';
      }
      return '';
    }
    
    // For Android local files or other platforms, use as-is
    if (isLocalFile) {
      console.log('[MP4Player] ========== Local File Processing ==========');
      console.log('[MP4Player] Local file URI:', uri);
      console.log('[MP4Player] Platform:', Platform.OS);
      console.log('[MP4Player] Retry attempt:', retryCount);
      return uri;
    }
    
    // For remote URLs, apply conversion and encoding
    let converted = convertToPlayableUrl(uri);
    
    // MIME correction: Ensure URL spacing is properly encoded
    converted = converted.replace(/[\s]/g, '%20');
    
    console.log('[MP4Player] ========== URI Processing ==========');
    console.log('[MP4Player] Original URI:', uri);
    console.log('[MP4Player] Converted URI:', converted);
    console.log('[MP4Player] Platform:', Platform.OS);
    console.log('[MP4Player] Retry attempt:', retryCount);
    console.log('[MP4Player] MIME correction applied:', converted !== uri);
    return converted;
  }, [uri, retryCount, isLocalFile, processedLocalUri, isCopyingFile]);

  const player = useVideoPlayer(processedUri, (player) => {
    if (!player) return;
    
    console.log('[MP4Player] Initializing player with URI:', processedUri);
    player.loop = false;
    player.muted = false;
    
    // CRITICAL FIX: Delayed autoplay to avoid race condition
    // Wait for player to be fully ready before attempting to play
    if (autoPlay) {
      console.log('[MP4Player] Auto-play enabled, scheduling delayed playback (500ms)');
      setTimeout(() => {
        if (player && player.status === 'readyToPlay') {
          try {
            console.log('[MP4Player] Executing delayed auto-play');
            player.play();
          } catch (e) {
            console.warn('[MP4Player] Delayed auto-play failed:', e);
          }
        } else {
          console.warn('[MP4Player] Player not ready for auto-play after delay, status:', player?.status);
        }
      }, 500);
    }
  });

  useEffect(() => {
    if (!player) {
      console.warn('[MP4Player] ❌ Player instance is null');
      return;
    }

    if (!processedUri || processedUri.trim() === '') {
      console.warn('[MP4Player] ❌ No valid URI to play');
      setError('No video URL provided');
      setIsLoading(false);
      return;
    }

    console.log('[MP4Player] ========== Player Initialization ==========');
    console.log('[MP4Player] Original URI:', uri);
    console.log('[MP4Player] Processed URI:', processedUri);
    console.log('[MP4Player] Auto-play:', autoPlay);
    console.log('[MP4Player] Platform:', Platform.OS);
    console.log('[MP4Player] Player instance:', player ? '✅ Available' : '❌ NULL');
    console.log('[MP4Player] Retry count:', `${retryCount}/${maxRetries}`);

    if (processedUri && processedUri !== '') {
      try {
        new URL(processedUri);
        console.log('[MP4Player] ✅ URL format is valid');
      } catch (urlError) {
        const errorMsg = 'Invalid video URL format';
        console.error('[MP4Player] ❌ URL validation failed:', urlError);
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
        return;
      }
    }

    const runDiagnostics = async () => {
      console.log('[MP4Player] 🔍 Running MP4 diagnostics...');
      try {
        const diagResult = await diagnoseMP4Url(processedUri);
        setDiagnostics(diagResult);
        console.log('[MP4Player] 📊 Diagnostics complete:');
        console.log(formatDiagnosticsReport(diagResult));
        
        // For local files, only log diagnostic info - don't fail
        if (diagResult.isLocalFile) {
          console.log('[MP4Player] ✅ Local file detected:', diagResult.fileInfo?.name);
          if (diagResult.warnings.length > 0) {
            console.warn('[MP4Player] ⚠️ Local file warnings:', diagResult.warnings);
          }
          // Continue with playback even if there are warnings
          return;
        }
        
        // For remote files, enforce validation
        if (!diagResult.isValid) {
          const errorMsg = `MP4 Validation Failed:\n${diagResult.errors.join('\n')}`;
          console.error('[MP4Player] ❌ Diagnostics failed:', errorMsg);
          setError(errorMsg);
          setIsLoading(false);
          onError?.(errorMsg);
          return;
        }
        
        if (diagResult.warnings.length > 0) {
          console.warn('[MP4Player] ⚠️ Diagnostics warnings:', diagResult.warnings);
          console.warn('[MP4Player] 💡 Recommendations:', diagResult.recommendations);
        }
      } catch (diagError) {
        console.error('[MP4Player] ⚠️ Diagnostics failed but continuing:', diagError);
      }
    };
    
    runDiagnostics();

    const statusSubscription = player.addListener('statusChange', (status) => {
      console.log('[MP4Player] Status change:', {
        status: status.status,
        oldStatus: status.oldStatus,
        timestamp: new Date().toISOString(),
      });
      
      if (status.status === 'readyToPlay') {
        console.log('[MP4Player] ✅ Video ready to play');
        console.log('[MP4Player] Duration:', player.duration, 'seconds');
        console.log('[MP4Player] Current time:', player.currentTime, 'seconds');
        
        setIsLoading(false);
        setError(null);
        setHasInitialized(true);
        
        if (autoPlay && player) {
          console.log('[MP4Player] Auto-playing video');
          try {
            player.play();
            onPlaybackStart?.();
          } catch (e) {
            console.error('[MP4Player] Auto-play failed:', e);
          }
        }
      } else if (status.status === 'loading') {
        console.log('[MP4Player] 📥 Loading video...', processedUri);
        setIsLoading(true);
      } else if (status.status === 'error') {
        let errorMsg = 'Unknown playback error';
        
        if (status.error) {
          if (typeof status.error === 'object' && 'message' in status.error) {
            errorMsg = String((status.error as any).message || 'Unknown error');
          } else if (typeof status.error === 'string') {
            errorMsg = status.error;
          } else {
            errorMsg = JSON.stringify(status.error);
          }
        }
        
        console.error('[MP4Player] ========== PLAYBACK ERROR ==========');
        console.error('[MP4Player] ❌ Error message:', errorMsg);
        console.error('[MP4Player] 🔗 URI:', processedUri);
        console.error('[MP4Player] 📱 Platform:', Platform.OS);
        console.error('[MP4Player] 📁 Is local file:', isLocalFile);
        console.error('[MP4Player] 🔄 Retry count:', `${retryCount}/${maxRetries}`);
        console.error('[MP4Player] ⏰ Timestamp:', new Date().toISOString());
        
        if (diagnostics) {
          console.error('[MP4Player] 📊 Previous diagnostics:');
          console.error(formatDiagnosticsReport(diagnostics));
          
          if (isLocalFile) {
            console.error('[MP4Player] 🔍 Local file troubleshooting:');
            console.error('[MP4Player]   - Check file permissions');
            console.error('[MP4Player]   - Verify file format (H.264/AAC)');
            console.error('[MP4Player]   - File path:', uri);
            if (diagnostics.fileInfo) {
              console.error('[MP4Player]   - File name:', diagnostics.fileInfo.name);
            }
          }
        }
        
        if (retryCount < maxRetries) {
          console.log(`[MP4Player] 🔄 Attempting retry ${retryCount + 1}/${maxRetries}...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            setError(null);
            setIsLoading(true);
          }, 1000 * (retryCount + 1));
          return;
        }
        
        let fullErrorMsg = `Unable to play video after ${maxRetries + 1} attempts\n\n❌ Error: ${errorMsg}`;
        
        if (isLocalFile) {
          fullErrorMsg += `\n\n📁 Local File Issues:\n• Check if the app has permission to read this file\n• Verify the file is not corrupted\n• Supported formats: MP4 (H.264 + AAC), MOV, M4V\n• Try selecting the file again\n\n📋 File Info:\n${diagnostics?.fileInfo?.name || 'Unknown'}`;
          if (Platform.OS === 'android') {
            fullErrorMsg += '\n\n⚠️ Android Note: Some file paths from external apps may not be accessible';
          }
        } else {
          fullErrorMsg += `\n\n🔍 Diagnostics:\n${diagnostics ? formatDiagnosticsReport(diagnostics) : 'No diagnostics available'}`;
        }
        
        console.error('[MP4Player] ❌ All retry attempts exhausted');
        setIsLoading(false);
        setError(fullErrorMsg);
        onError?.(fullErrorMsg);
      } else if (status.status === 'idle') {
        console.log('[MP4Player] 💤 Player idle');
      }
    });

    const playingSubscription = player.addListener('playingChange', (event) => {
      console.log('[MP4Player] Playing state changed:', {
        isPlaying: event.isPlaying,
        currentTime: player.currentTime,
        duration: player.duration,
      });
      
      if (event.isPlaying && hasInitialized) {
        onPlaybackStart?.();
      }
    });

    const volumeSubscription = player.addListener('volumeChange', (event) => {
      console.log('[MP4Player] Volume changed:', {
        volume: event.volume,
        isMuted: event.isMuted,
      });
    });

    return () => {
      console.log('[MP4Player] Cleaning up player subscriptions');
      statusSubscription.remove();
      playingSubscription.remove();
      volumeSubscription.remove();
    };
  }, [player, uri, processedUri, autoPlay, hasInitialized, onPlaybackStart, onError, retryCount, diagnostics, isLocalFile]);

  const handleBackPress = useCallback(() => {
    if (onBackPress) {
      onBackPress();
    }
  }, [onBackPress]);



  if (!uri || uri.trim() === '') {
    console.warn('[MP4Player] No URI provided, returning null');
    return null;
  }

  if (isLoading || isCopyingFile) {
    return (
      <View style={[styles.container, isFullscreen && styles.fullscreen, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>
            {isCopyingFile ? 'Preparing local video...' : 'Loading video...'}
          </Text>
          <Text style={styles.loadingSubtext}>
            {isCopyingFile 
              ? 'Copying file to app cache for playback' 
              : 'Please wait while the video loads'
            }
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, isFullscreen && styles.fullscreen, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Play Video</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>
            Please check:
            {'\n'}• The video URL is valid
            {'\n'}• The video file is accessible
            {'\n'}• Your internet connection is stable
            {'\n'}• The video format is supported (MP4, WebM, OGG)
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreen, style]}>
      <VideoView
        ref={videoRef}
        player={player} 
        style={[styles.video, isFullscreen && styles.fullscreenVideo]}
        nativeControls={Platform.OS === 'android' ? true : true}
        contentFit={isFullscreen ? "cover" : "contain"}
        allowsFullscreen={true}
        allowsPictureInPicture={true}
      />
      {isFullscreen && onBackPress && (
        <TouchableOpacity 
          onPress={handleBackPress}
          style={[styles.backButton, { top: insets.top + 16 }]}
        >
          <View style={styles.backButtonInner}>
            <ArrowLeft color="#ffffff" size={24} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    borderRadius: 0,
    borderWidth: 0,
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    gap: 16,
    padding: 20,
  },
  loadingText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  errorText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorHint: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'left',
    marginTop: 12,
    lineHeight: 18,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  backButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MP4Player;
