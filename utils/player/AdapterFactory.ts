import { Platform } from 'react-native';
import { detectVideoSource, VideoSourceInfo } from '@/utils/videoSourceDetector';
import { PlayerAdapter, PlayerType } from './PlayerAdapter';
import { NativePlayerAdapter } from './adapters/NativePlayerAdapter';
import { WebViewPlayerAdapter } from './adapters/WebViewPlayerAdapter';
import { CloudDrivePlayerAdapter } from './adapters/CloudDrivePlayerAdapter';
import { SocialMediaPlayerAdapter } from './adapters/SocialMediaPlayerAdapter';
import { TwitchPlayerAdapter } from './adapters/TwitchPlayerAdapter';
import { FacebookPlayerAdapter } from './adapters/FacebookPlayerAdapter';
import { DailymotionPlayerAdapter } from './adapters/DailymotionPlayerAdapter';
import { AdultPlatformAdapter, ADULT_PLATFORM_CONFIGS } from './adapters/AdultPlatformAdapter';
import { LiveStreamAdapter } from './adapters/LiveStreamAdapter';
import { FFmpegPlayerAdapter } from './adapters/FFmpegPlayerAdapter';

export interface AdapterSelectionResult {
  adapter: PlayerAdapter;
  sourceInfo: VideoSourceInfo;
  fallbackChain: PlayerType[];
}

export class PlayerAdapterFactory {
  static async createAdapter(url: string): Promise<AdapterSelectionResult> {
    console.log('[PlayerAdapterFactory] Creating adapter for URL:', url);
    
    const sourceInfo = detectVideoSource(url);
    console.log('[PlayerAdapterFactory] Source info:', sourceInfo);
    
    const fallbackChain = this.buildFallbackChain(sourceInfo);
    console.log('[PlayerAdapterFactory] Fallback chain:', fallbackChain);
    
    const adapter = await this.instantiateAdapter(fallbackChain[0], sourceInfo);
    
    return {
      adapter,
      sourceInfo,
      fallbackChain,
    };
  }
  
  private static buildFallbackChain(sourceInfo: VideoSourceInfo): PlayerType[] {
    const chain: PlayerType[] = [];
    
    switch (sourceInfo.type) {
      case 'youtube':
        chain.push('webview');
        break;
        
      case 'gdrive':
      case 'dropbox':
        chain.push('cloud', 'webview');
        break;
        
      case 'twitter':
      case 'instagram':
      case 'tiktok':
        chain.push('social', 'webview');
        break;
        
      case 'hls':
        if (Platform.OS === 'ios') {
          chain.push('native', 'hls', 'webview');
        } else {
          chain.push('hls', 'native', 'webview');
        }
        break;
        
      case 'dash':
        chain.push('dash', 'webview');
        break;
        
      case 'rtmp':
        chain.push('rtmp', 'ffmpeg', 'webview');
        break;
        
      case 'direct':
        if (sourceInfo.streamType) {
          switch (sourceInfo.streamType) {
            case 'mp4':
            case 'webm':
            case 'ogg':
              chain.push('native', 'webview');
              break;
            case 'mkv':
            case 'avi':
            case 'wmv':
            case 'flv':
            case 'mov':
              chain.push('ffmpeg', 'webview');
              break;
            default:
              chain.push('native', 'ffmpeg', 'webview');
          }
        } else {
          chain.push('native', 'webview');
        }
        break;
        
      case 'adult':
        chain.push('webview');
        break;
        
      case 'twitch':
        chain.push('webview');
        break;
        
      case 'facebook':
        chain.push('webview');
        break;
        
      case 'dailymotion':
        chain.push('webview');
        break;
        
      case 'vimeo':
        chain.push('webview');
        break;
        
      default:
        chain.push('webview');
    }
    
    return chain;
  }
  
  private static async instantiateAdapter(
    type: PlayerType,
    sourceInfo: VideoSourceInfo
  ): Promise<PlayerAdapter> {
    console.log(`[PlayerAdapterFactory] Instantiating ${type} adapter`);
    
    switch (type) {
      case 'native':
      case 'hls':
      case 'dash':
        return new NativePlayerAdapter();
        
      case 'cloud':
        return new CloudDrivePlayerAdapter(sourceInfo.platform);
        
      case 'social':
        return new SocialMediaPlayerAdapter(sourceInfo.platform);
        
      case 'webview':
        if (sourceInfo.type === 'twitch') {
          return new TwitchPlayerAdapter();
        } else if (sourceInfo.type === 'facebook') {
          return new FacebookPlayerAdapter();
        } else if (sourceInfo.type === 'dailymotion') {
          return new DailymotionPlayerAdapter();
        } else if (sourceInfo.type === 'adult') {
          const platformName = this.detectAdultPlatform(sourceInfo.platform);
          return new AdultPlatformAdapter(platformName);
        }
        return new WebViewPlayerAdapter();
        
      case 'ffmpeg':
        return new FFmpegPlayerAdapter();
        
      case 'rtmp':
        return new LiveStreamAdapter('rtmp');
        
      default:
        throw new Error(`Unknown adapter type: ${type}`);
    }
  }
  
  private static detectAdultPlatform(platformName: string): string {
    const normalizedName = platformName.toLowerCase().replace(/\s+/g, '');
    
    for (const key of Object.keys(ADULT_PLATFORM_CONFIGS)) {
      if (normalizedName.includes(key)) {
        return key;
      }
    }
    
    return 'generic';
  }
  
  static async createFallbackAdapter(
    fallbackChain: PlayerType[],
    currentIndex: number,
    sourceInfo: VideoSourceInfo
  ): Promise<PlayerAdapter | null> {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= fallbackChain.length) {
      console.error('[PlayerAdapterFactory] No more fallback adapters available');
      return null;
    }
    
    const nextType = fallbackChain[nextIndex];
    console.log(`[PlayerAdapterFactory] Creating fallback adapter: ${nextType}`);
    
    try {
      return await this.instantiateAdapter(nextType, sourceInfo);
    } catch (error) {
      console.error(`[PlayerAdapterFactory] Failed to create fallback adapter:`, error);
      return await this.createFallbackAdapter(fallbackChain, nextIndex, sourceInfo);
    }
  }
}
