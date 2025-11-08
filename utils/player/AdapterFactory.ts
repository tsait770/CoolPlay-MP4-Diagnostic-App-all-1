import { Platform } from 'react-native';
import { detectVideoSource, VideoSourceInfo } from '@/utils/videoSourceDetector';
import { PlayerAdapter, PlayerType } from './PlayerAdapter';
import { NativePlayerAdapter } from './adapters/NativePlayerAdapter';
import { WebViewPlayerAdapter } from './adapters/WebViewPlayerAdapter';
import { YouTubePlayerAdapter } from './adapters/YouTubePlayerAdapter';
import { CloudDrivePlayerAdapter } from './adapters/CloudDrivePlayerAdapter';
import { SocialMediaPlayerAdapter } from './adapters/SocialMediaPlayerAdapter';

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
        chain.push('youtube', 'webview');
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
      case 'twitch':
      case 'facebook':
      case 'dailymotion':
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
        
      case 'youtube':
        return new YouTubePlayerAdapter();
        
      case 'cloud':
        return new CloudDrivePlayerAdapter(sourceInfo.platform);
        
      case 'social':
        return new SocialMediaPlayerAdapter(sourceInfo.platform);
        
      case 'webview':
        return new WebViewPlayerAdapter();
        
      case 'ffmpeg':
        throw new Error('FFmpeg adapter not yet implemented');
        
      case 'rtmp':
        throw new Error('RTMP adapter not yet implemented');
        
      default:
        throw new Error(`Unknown adapter type: ${type}`);
    }
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
