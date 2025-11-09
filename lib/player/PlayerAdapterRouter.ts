import { RefObject } from 'react';
import { WebView } from 'react-native-webview';
import {
  UniversalPlayerController,
  VideoSourceConfig,
} from './UniversalPlayerController';
import { NativePlayerAdapter } from './adapters/NativePlayerAdapter';
import { WebViewPlayerAdapter } from './adapters/WebViewPlayerAdapter';
import { detectVideoSource, VideoSourceInfo } from '@/utils/videoSourceDetector';

export class PlayerAdapterRouter {
  private static readonly NATIVE_SUPPORTED_TYPES = [
    'direct',
    'stream',
    'hls',
    'dash',
  ];

  private static readonly WEBVIEW_REQUIRED_TYPES = [
    'youtube',
    'vimeo',
    'adult',
    'webview',
    'twitter',
    'instagram',
    'tiktok',
    'twitch',
    'facebook',
    'dailymotion',
    'rumble',
    'odysee',
    'bilibili',
    'gdrive',
    'dropbox',
  ];

  static shouldUseNativePlayer(sourceInfo: VideoSourceInfo): boolean {
    return this.NATIVE_SUPPORTED_TYPES.includes(sourceInfo.type);
  }

  static shouldUseWebViewPlayer(sourceInfo: VideoSourceInfo): boolean {
    return (
      sourceInfo.requiresWebView ||
      this.WEBVIEW_REQUIRED_TYPES.includes(sourceInfo.type)
    );
  }

  static detectPlayerType(url: string): 'native' | 'webview' | 'unsupported' {
    const sourceInfo = detectVideoSource(url);
    
    console.log('[PlayerAdapterRouter] Detecting player type for:', {
      url,
      type: sourceInfo.type,
      platform: sourceInfo.platform,
    });

    if (sourceInfo.type === 'unsupported' || sourceInfo.type === 'unknown') {
      return 'unsupported';
    }

    if (this.shouldUseNativePlayer(sourceInfo)) {
      return 'native';
    }

    if (this.shouldUseWebViewPlayer(sourceInfo)) {
      return 'webview';
    }

    return 'unsupported';
  }

  static createAdapter(
    url: string,
    webViewRef?: RefObject<WebView>
  ): UniversalPlayerController | null {
    const sourceInfo = detectVideoSource(url);
    const playerType = this.detectPlayerType(url);

    console.log('[PlayerAdapterRouter] Creating adapter:', {
      url,
      playerType,
      sourceType: sourceInfo.type,
      platform: sourceInfo.platform,
    });

    if (playerType === 'unsupported') {
      console.error('[PlayerAdapterRouter] Unsupported video source:', sourceInfo);
      return null;
    }

    const config: VideoSourceConfig = {
      uri: url,
      type: sourceInfo.type as any,
      platform: sourceInfo.platform,
      requiresWebView: sourceInfo.requiresWebView,
      requiresAgeVerification: sourceInfo.requiresAgeVerification,
    };

    if (playerType === 'native') {
      return new NativePlayerAdapter(url, config);
    }

    if (playerType === 'webview' && webViewRef) {
      return new WebViewPlayerAdapter(webViewRef, config);
    }

    console.error('[PlayerAdapterRouter] WebView ref required but not provided');
    return null;
  }

  static getSourceConfig(url: string): VideoSourceConfig | null {
    const sourceInfo = detectVideoSource(url);
    
    if (sourceInfo.type === 'unsupported' || sourceInfo.type === 'unknown') {
      return null;
    }

    return {
      uri: url,
      type: sourceInfo.type as any,
      platform: sourceInfo.platform,
      requiresWebView: sourceInfo.requiresWebView,
      requiresAgeVerification: sourceInfo.requiresAgeVerification,
    };
  }
}
