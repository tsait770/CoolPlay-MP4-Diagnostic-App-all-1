/**
 * MP4 Native Player Component
 * Uses expo-video with AVPlayer (iOS) / ExoPlayer (Android)
 * Handles Range Request validation and codec detection
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  AlertCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

export interface MP4PlayerProps {
  url: string;
  autoplay?: boolean;
  onError?: (error: string) => void;
  onReady?: () => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  style?: any;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  supportsRange: boolean;
  contentType?: string;
  contentLength?: number;
  redirectUrl?: string;
}

async function validateMP4Url(url: string): Promise<ValidationResult> {
  try {
    console.log('[MP4Player] Validating URL:', url);
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'video/mp4,video/*,*/*',
        'Range': 'bytes=0-1',
      },
    });

    const contentType = response.headers.get('content-type');
    const acceptRanges = response.headers.get('accept-ranges');
    const contentRange = response.headers.get('content-range');
    const contentLength = response.headers.get('content-length');

    console.log('[MP4Player] Validation result:', {
      status: response.status,
      contentType,
      acceptRanges,
      contentRange,
      contentLength,
      url: response.url,
    });

    if (!response.ok && response.status !== 206) {
      return {
        isValid: false,
        error: `Server returned status ${response.status}`,
        supportsRange: false,
      };
    }

    const supportsRange = acceptRanges === 'bytes' || contentRange !== null;

    if (!contentType || !contentType.includes('video')) {
      console.warn('[MP4Player] Content-Type may not be video:', contentType);
    }

    return {
      isValid: true,
      supportsRange,
      contentType: contentType || undefined,
      contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
      redirectUrl: response.url !== url ? response.url : undefined,
    };
  } catch (error) {
    console.error('[MP4Player] Validation error:', error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
      supportsRange: false,
    };
  }
}

export default function MP4Player({
  url,
  autoplay = false,
  onError,
  onReady,
  onPlaybackStart,
  onPlaybackEnd,
  style,
}: MP4PlayerProps) {
  const [isValidating, setIsValidating] = useState(true);
  const [validatedUrl, setValidatedUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const player = useVideoPlayer(validatedUrl || url, (player) => {
    player.loop = false;
    player.muted = isMuted;
    if (autoplay && validatedUrl) {
      player.play();
    }
  });

  useEffect(() => {
    if (!url || url.trim() === '') {
      setValidationError('No video URL provided');
      setIsValidating(false);
      return;
    }

    console.log('[MP4Player] Starting validation for:', url);
    setIsValidating(true);
    setValidationError(null);

    validateMP4Url(url)
      .then((result) => {
        console.log('[MP4Player] Validation complete:', result);
        
        if (!result.isValid) {
          const error = result.error || 'Invalid video URL';
          console.error('[MP4Player] Validation failed:', error);
          setValidationError(error);
          onError?.(error);
          setIsValidating(false);
          return;
        }

        if (!result.supportsRange) {
          console.warn('[MP4Player] Server does not support Range requests');
          console.warn('[MP4Player] Seeking may not work properly');
        }

        const urlToUse = result.redirectUrl || url;
        console.log('[MP4Player] Using URL:', urlToUse);
        setValidatedUrl(urlToUse);
        setIsValidating(false);
      })
      .catch((error) => {
        console.error('[MP4Player] Validation exception:', error);
        console.log('[MP4Player] Proceeding with original URL');
        setValidatedUrl(url);
        setIsValidating(false);
      });
  }, [url]);

  useEffect(() => {
    if (!player) return;

    const playingSubscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
      if (event.isPlaying && onPlaybackStart) {
        onPlaybackStart();
      }
    });

    const statusSubscription = player.addListener('statusChange', (status) => {
      console.log('[MP4Player] Status change:', status.status);
      
      if (status.status === 'readyToPlay') {
        console.log('[MP4Player] Ready to play');
        onReady?.();
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
        
        console.error('[MP4Player] Playback error:', errorMsg);
        
        if (errorMsg.includes('codec') || errorMsg.includes('format')) {
          errorMsg = `視頻編碼格式不支援\n\n${errorMsg}\n\n建議：\n• 確認影片使用 H.264 編碼\n• 避免使用 HEVC/H.265\n• 確認檔案格式為標準 MP4`;
        } else if (errorMsg.includes('source') || errorMsg.includes('uri')) {
          errorMsg = `視頻來源錯誤\n\n無法載入視頻檔案\n\n請檢查：\n• URL 是否正確\n• 檔案是否存在\n• 網路連線是否正常`;
        }
        
        setPlaybackError(errorMsg);
        onError?.(errorMsg);
      }
    });

    return () => {
      playingSubscription.remove();
      statusSubscription.remove();
    };
  }, [player, onReady, onError, onPlaybackStart]);

  const handlePlayPause = useCallback(() => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  }, [player, isPlaying]);

  const handleMute = useCallback(() => {
    if (!player) return;
    player.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [player, isMuted]);

  const handleSeek = useCallback((seconds: number) => {
    if (!player) return;
    const currentTime = player.currentTime || 0;
    const newPosition = Math.max(0, currentTime + seconds);
    player.currentTime = newPosition;
  }, [player]);

  if (validationError || playbackError) {
    const error = validationError || playbackError;
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.semantic.danger} />
          <Text style={styles.errorTitle}>MP4 播放錯誤</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      </View>
    );
  }

  if (isValidating) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
          <Text style={styles.loadingText}>驗證視頻來源中...</Text>
        </View>
      </View>
    );
  }

  if (!player || !validatedUrl) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
          <Text style={styles.loadingText}>初始化播放器中...</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      activeOpacity={1}
      onPress={() => setShowControls(true)}
    >
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
        allowsFullscreen
        allowsPictureInPicture
      />
      
      {showControls && (
        <View style={styles.controlsOverlay}>
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => handleSeek(-10)}
            >
              <SkipBack size={24} color="#fff" />
              <Text style={styles.controlButtonText}>10s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButtonLarge}
              onPress={handlePlayPause}
            >
              {isPlaying ? (
                <Pause size={48} color="#fff" fill="#fff" />
              ) : (
                <Play size={48} color="#fff" fill="#fff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => handleSeek(10)}
            >
              <SkipForward size={24} color="#fff" />
              <Text style={styles.controlButtonText}>10s</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.controlButton} onPress={handleMute}>
              {isMuted ? (
                <VolumeX size={24} color="#fff" />
              ) : (
                <Volume2 size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  controlButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    gap: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
  },
});
