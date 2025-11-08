import { PlayerAdapter } from './PlayerAdapter';
import { EnhancedNativePlayerAdapter, VIDEO_FORMATS } from './adapters/EnhancedNativePlayerAdapter';
import { WebViewPlayerAdapter } from './adapters/WebViewPlayerAdapter';
import { AdultPlatformAdapter } from './adapters/AdultPlatformAdapter';
import { FFmpegPlayerAdapter } from './adapters/FFmpegPlayerAdapter';
import { SocialMediaPlayerAdapter } from './adapters/SocialMediaPlayerAdapter';
import { TwitchPlayerAdapter } from './adapters/TwitchPlayerAdapter';
import { FacebookPlayerAdapter } from './adapters/FacebookPlayerAdapter';
import { detectVideoSource } from '@/utils/videoSourceDetector';

export interface AdapterSelectionResult {
  adapter: PlayerAdapter;
  reason: string;
  fallbackAvailable: boolean;
  fallbackAdapter?: PlayerAdapter;
}

export class EnhancedAdapterFactory {
  private static instance: EnhancedAdapterFactory;

  private constructor() {
    console.log('[EnhancedAdapterFactory] Initialized');
  }

  public static getInstance(): EnhancedAdapterFactory {
    if (!EnhancedAdapterFactory.instance) {
      EnhancedAdapterFactory.instance = new EnhancedAdapterFactory();
    }
    return EnhancedAdapterFactory.instance;
  }

  public selectAdapter(url: string): AdapterSelectionResult {
    console.log('[EnhancedAdapterFactory] Selecting adapter for URL:', url);

    const sourceInfo = detectVideoSource(url);
    console.log('[EnhancedAdapterFactory] Source info:', sourceInfo);

    if (sourceInfo.type === 'adult') {
      const platformName = sourceInfo.platform.toLowerCase();
      const adapter = new AdultPlatformAdapter(platformName);
      
      console.log('[EnhancedAdapterFactory] Selected AdultPlatformAdapter for', sourceInfo.platform);
      
      return {
        adapter,
        reason: `成人平台 ${sourceInfo.platform} 檢測：使用專用適配器`,
        fallbackAvailable: false,
      };
    }

    if (sourceInfo.type === 'twitter' || sourceInfo.type === 'instagram' || sourceInfo.type === 'tiktok') {
      const adapter = new SocialMediaPlayerAdapter(sourceInfo.type);
      
      console.log('[EnhancedAdapterFactory] Selected SocialMediaPlayerAdapter for', sourceInfo.platform);
      
      return {
        adapter,
        reason: `社交媒體平台 ${sourceInfo.platform} 檢測：使用社交媒體適配器`,
        fallbackAvailable: true,
        fallbackAdapter: new WebViewPlayerAdapter(),
      };
    }

    if (sourceInfo.type === 'twitch') {
      const adapter = new TwitchPlayerAdapter();
      
      console.log('[EnhancedAdapterFactory] Selected TwitchPlayerAdapter');
      
      return {
        adapter,
        reason: 'Twitch 直播平台檢測：使用 Twitch 適配器',
        fallbackAvailable: true,
        fallbackAdapter: new WebViewPlayerAdapter(),
      };
    }

    if (sourceInfo.type === 'facebook') {
      const adapter = new FacebookPlayerAdapter();
      
      console.log('[EnhancedAdapterFactory] Selected FacebookPlayerAdapter');
      
      return {
        adapter,
        reason: 'Facebook 視頻檢測：使用 Facebook 適配器',
        fallbackAvailable: true,
        fallbackAdapter: new WebViewPlayerAdapter(),
      };
    }

    const format = this.detectFormat(url);
    
    if (format) {
      if (format.requiresTranscoding) {
        const adapter = new FFmpegPlayerAdapter();
        const nativeAdapter = new EnhancedNativePlayerAdapter();
        
        console.log('[EnhancedAdapterFactory] Format requires transcoding:', format.format);
        console.log('[EnhancedAdapterFactory] Selected FFmpegPlayerAdapter with native fallback');
        
        return {
          adapter,
          reason: `檢測到 ${format.format.toUpperCase()} 格式：需要 FFmpeg 轉碼`,
          fallbackAvailable: true,
          fallbackAdapter: nativeAdapter,
        };
      }
      
      if (format.isSupported) {
        const adapter = new EnhancedNativePlayerAdapter();
        
        console.log('[EnhancedAdapterFactory] Format natively supported:', format.format);
        console.log('[EnhancedAdapterFactory] Selected EnhancedNativePlayerAdapter');
        
        return {
          adapter,
          reason: `檢測到 ${format.format.toUpperCase()} 格式：原生支援`,
          fallbackAvailable: true,
          fallbackAdapter: new WebViewPlayerAdapter(),
        };
      }
    }

    if (sourceInfo.type === 'hls' || sourceInfo.type === 'dash' || sourceInfo.type === 'stream') {
      const adapter = new EnhancedNativePlayerAdapter();
      
      console.log('[EnhancedAdapterFactory] Streaming format detected:', sourceInfo.streamType);
      console.log('[EnhancedAdapterFactory] Selected EnhancedNativePlayerAdapter');
      
      return {
        adapter,
        reason: `檢測到串流格式 ${sourceInfo.streamType?.toUpperCase()}：使用原生播放器`,
        fallbackAvailable: true,
        fallbackAdapter: new WebViewPlayerAdapter(),
      };
    }

    if (
      sourceInfo.requiresWebView ||
      sourceInfo.type === 'youtube' ||
      sourceInfo.type === 'vimeo' ||
      sourceInfo.type === 'dailymotion' ||
      sourceInfo.type === 'rumble' ||
      sourceInfo.type === 'bilibili'
    ) {
      const adapter = new WebViewPlayerAdapter();
      
      console.log('[EnhancedAdapterFactory] Platform requires WebView:', sourceInfo.platform);
      console.log('[EnhancedAdapterFactory] Selected WebViewPlayerAdapter');
      
      return {
        adapter,
        reason: `平台 ${sourceInfo.platform} 需要 WebView 支援`,
        fallbackAvailable: false,
      };
    }

    const defaultAdapter = new EnhancedNativePlayerAdapter();
    
    console.log('[EnhancedAdapterFactory] No specific adapter matched, using default EnhancedNativePlayerAdapter');
    
    return {
      adapter: defaultAdapter,
      reason: '使用預設原生播放器',
      fallbackAvailable: true,
      fallbackAdapter: new WebViewPlayerAdapter(),
    };
  }

  private detectFormat(url: string): { format: string; isSupported: boolean; requiresTranscoding: boolean } | null {
    const urlLower = url.toLowerCase();
    
    for (const [ext, format] of Object.entries(VIDEO_FORMATS)) {
      if (urlLower.includes(`.${ext}`) || urlLower.includes(`/${ext}/`)) {
        console.log('[EnhancedAdapterFactory] Detected format:', format);
        return format;
      }
    }
    
    if (urlLower.includes('m3u8')) {
      return VIDEO_FORMATS.m3u8;
    }
    if (urlLower.includes('.mpd')) {
      return VIDEO_FORMATS.mpd;
    }
    
    return null;
  }

  public createAdapter(url: string): PlayerAdapter {
    const result = this.selectAdapter(url);
    console.log('[EnhancedAdapterFactory] Created adapter:', result.reason);
    return result.adapter;
  }

  public createAdapterWithFallback(url: string): {
    primary: PlayerAdapter;
    fallback?: PlayerAdapter;
    reason: string;
  } {
    const result = this.selectAdapter(url);
    
    return {
      primary: result.adapter,
      fallback: result.fallbackAdapter,
      reason: result.reason,
    };
  }
}

export const enhancedAdapterFactory = EnhancedAdapterFactory.getInstance();
