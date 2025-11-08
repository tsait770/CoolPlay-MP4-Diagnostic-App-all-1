/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * YouTube Player Manager (集成管理器)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 职责：
 * - 整合 Parser 和 Player
 * - 管理播放器生命周期
 * - 处理多种 fallback 策略
 * - 提供统一的外部接口
 * 
 * 使用方式：
 * <YouTubePlayerManager 
 *   url="https://youtube.com/watch?v=xxx"
 *   autoPlay={true}
 *   onError={(error) => console.log(error)}
 * />
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import YouTubePlayer from './YouTubePlayer';
import { youtubeParser } from '@/utils/youtube/YouTubeParser';
import Colors from '@/constants/colors';

export interface YouTubePlayerManagerProps {
  url: string;
  autoPlay?: boolean;
  onReady?: () => void;
  onError?: (error: string) => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  style?: any;
  maxRetries?: number;
}

export default function YouTubePlayerManager({
  url,
  autoPlay = false,
  onReady,
  onError,
  onPlaybackStart,
  onPlaybackEnd,
  style,
  maxRetries = 3,
}: YouTubePlayerManagerProps) {
  const [isValidating, setIsValidating] = useState(true);
  const [videoInfo, setVideoInfo] = useState<{
    videoId: string;
    embedUrls: string[];
    isValid: boolean;
    errorMessage?: string;
  } | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [hasError, setHasError] = useState(false);

  console.log('[YouTubePlayerManager] Initializing with URL:', url);
  console.log('[YouTubePlayerManager] Current attempt:', currentAttempt, '/', maxRetries);

  const validateAndParseUrl = useCallback(() => {
    console.log('[YouTubePlayerManager] Validating URL...');
    setIsValidating(true);
    setHasError(false);

    const parsed = youtubeParser.parse(url);

    console.log('[YouTubePlayerManager] Parse result:', {
      isValid: parsed.isValid,
      videoId: parsed.videoId,
      type: parsed.type,
      errorMessage: parsed.errorMessage,
    });

    if (!parsed.isValid || !parsed.videoId) {
      const errorMsg = parsed.errorMessage || 'Invalid YouTube URL';
      console.error('[YouTubePlayerManager]', errorMsg);
      setVideoInfo({
        videoId: '',
        embedUrls: [],
        isValid: false,
        errorMessage: errorMsg,
      });
      setIsValidating(false);
      onError?.(errorMsg);
      return;
    }

    const embedUrls = youtubeParser.generateFallbackUrls(parsed.videoId, {
      autoplay: autoPlay,
      start: parsed.timestamp,
    });

    console.log('[YouTubePlayerManager] Generated', embedUrls.length, 'fallback URLs');

    setVideoInfo({
      videoId: parsed.videoId,
      embedUrls,
      isValid: true,
    });
    setIsValidating(false);
    setCurrentAttempt(0);
  }, [url, autoPlay, onError]);

  useEffect(() => {
    validateAndParseUrl();
  }, [validateAndParseUrl]);

  const handlePlayerError = useCallback((error: string, errorCode?: number) => {
    console.error('[YouTubePlayerManager] Player error:', error, 'Code:', errorCode);

    if (!videoInfo || currentAttempt >= maxRetries) {
      console.error('[YouTubePlayerManager] Max attempts reached or no video info');
      setHasError(true);
      onError?.(error);
      return;
    }

    const nextAttempt = currentAttempt + 1;
    
    if (nextAttempt < videoInfo.embedUrls.length) {
      console.log(`[YouTubePlayerManager] Trying fallback URL ${nextAttempt + 1}/${videoInfo.embedUrls.length}`);
      setCurrentAttempt(nextAttempt);
    } else {
      console.error('[YouTubePlayerManager] All fallback URLs exhausted');
      setHasError(true);
      onError?.(error);
    }
  }, [videoInfo, currentAttempt, maxRetries, onError]);

  if (isValidating) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
          <Text style={styles.loadingText}>正在解析 YouTube 视频...</Text>
        </View>
      </View>
    );
  }

  if (!videoInfo || !videoInfo.isValid) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.semantic.danger} />
          <Text style={styles.errorTitle}>YouTube URL 无效</Text>
          <Text style={styles.errorMessage}>
            {videoInfo?.errorMessage || '无法解析 YouTube URL'}
          </Text>
        </View>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.semantic.danger} />
          <Text style={styles.errorTitle}>YouTube 播放失败</Text>
          <Text style={styles.errorMessage}>
            已尝试所有可用的播放方式，但视频无法播放。{'\n\n'}
            Video ID: {videoInfo.videoId}{'\n\n'}
            可能原因：{'\n'}
            • 视频禁止嵌入播放{'\n'}
            • 视频已被删除或设为私人{'\n'}
            • 地区限制{'\n'}
            • 网络连接问题{'\n\n'}
            建议：在 YouTube 网站直接测试该视频
          </Text>
        </View>
      </View>
    );
  }

  const embedUrl = videoInfo.embedUrls[currentAttempt];

  console.log('[YouTubePlayerManager] Rendering player with:', {
    videoId: videoInfo.videoId,
    embedUrl,
    attemptNumber: currentAttempt,
  });

  return (
    <YouTubePlayer
      videoId={videoInfo.videoId}
      embedUrl={embedUrl}
      autoPlay={autoPlay}
      onReady={onReady}
      onError={handlePlayerError}
      onPlaybackStart={onPlaybackStart}
      onPlaybackEnd={onPlaybackEnd}
      style={style}
      maxRetries={3}
      attemptNumber={currentAttempt}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
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
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },
});
