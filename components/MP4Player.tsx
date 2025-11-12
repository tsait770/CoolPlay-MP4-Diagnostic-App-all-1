import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const videoRef = useRef<VideoView>(null);
  const maxRetries = 2;

  const processedUri = React.useMemo(() => {
    if (!uri || uri.trim() === '') {
      return '';
    }
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
  }, [uri, retryCount]);

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
        console.error('[MP4Player] 🔄 Retry count:', `${retryCount}/${maxRetries}`);
        console.error('[MP4Player] ⏰ Timestamp:', new Date().toISOString());
        
        if (diagnostics) {
          console.error('[MP4Player] 📊 Previous diagnostics:');
          console.error(formatDiagnosticsReport(diagnostics));
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
        
        const fullErrorMsg = `Unable to play video after ${maxRetries + 1} attempts\n\n❌ Error: ${errorMsg}\n\n🔍 Diagnostics:\n${diagnostics ? formatDiagnosticsReport(diagnostics) : 'No diagnostics available'}`;
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
  }, [player, uri, processedUri, autoPlay, hasInitialized, onPlaybackStart, onError, retryCount, diagnostics]);

  const handleBackPress = useCallback(() => {
    if (onBackPress) {
      onBackPress();
    }
  }, [onBackPress]);



  if (!uri || uri.trim() === '') {
    console.warn('[MP4Player] No URI provided, returning null');
    return null;
  }

  if (isLoading) {
    return (
      <View style={[styles.container, isFullscreen && styles.fullscreen, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading video...</Text>
          <Text style={styles.loadingSubtext}>Please wait while the video loads</Text>
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
