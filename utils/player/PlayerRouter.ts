/**
 * 新的播放器路由系统
 * 负责根据 URL 类型选择合适的播放器
 * 确保每种格式使用最佳的播放器
 */

import { detectVideoSource, VideoSourceInfo } from '@/utils/videoSourceDetector';

export type PlayerType = 
  | 'youtube'         // 使用 DedicatedYouTubePlayer
  | 'mp4'             // 使用 DedicatedMP4Player
  | 'adult'           // 使用原有的 WebView 成人内容播放器
  | 'socialMedia'     // 使用 SocialMediaPlayer
  | 'native'          // 使用原生 VideoView
  | 'webview'         // 使用通用 WebView
  | 'unknown';        // 未知类型

export interface PlayerRouteResult {
  playerType: PlayerType;
  sourceInfo: VideoSourceInfo;
  shouldUseNewPlayer: boolean;
  originalUrl: string;
  processedUrl: string;
  reason: string;
}

export class PlayerRouter {
  private static instance: PlayerRouter;

  private constructor() {
    console.log('[PlayerRouter] Initialized');
  }

  public static getInstance(): PlayerRouter {
    if (!PlayerRouter.instance) {
      PlayerRouter.instance = new PlayerRouter();
    }
    return PlayerRouter.instance;
  }

  /**
   * 路由到正确的播放器
   */
  public route(url: string): PlayerRouteResult {
    console.log('[PlayerRouter] Routing URL:', url);

    if (!url || url.trim() === '') {
      console.error('[PlayerRouter] Invalid URL: empty');
      return {
        playerType: 'unknown',
        sourceInfo: {
          type: 'unknown',
          platform: 'Unknown',
          requiresPremium: false,
          error: 'Invalid URL: URL is empty',
          requiresWebView: false,
        },
        shouldUseNewPlayer: false,
        originalUrl: url,
        processedUrl: url,
        reason: 'Invalid URL',
      };
    }

    const sourceInfo = detectVideoSource(url);
    console.log('[PlayerRouter] Source info:', sourceInfo);

    if (sourceInfo.type === 'youtube') {
      console.log('[PlayerRouter] Routing to DedicatedYouTubePlayer');
      return {
        playerType: 'youtube',
        sourceInfo,
        shouldUseNewPlayer: true,
        originalUrl: url,
        processedUrl: url,
        reason: 'YouTube video detected - using dedicated YouTube player',
      };
    }

    if (sourceInfo.type === 'adult') {
      console.log('[PlayerRouter] Routing to existing adult content player');
      return {
        playerType: 'adult',
        sourceInfo,
        shouldUseNewPlayer: false,
        originalUrl: url,
        processedUrl: url,
        reason: 'Adult content detected - using existing WebView player to preserve functionality',
      };
    }

    if (sourceInfo.type === 'direct' && sourceInfo.streamType) {
      const ext = sourceInfo.streamType.toLowerCase();
      
      if (ext === 'mp4' || ext === 'webm' || ext === 'ogg' || ext === 'ogv' || ext === 'm4v' || ext === 'mov') {
        console.log('[PlayerRouter] Routing to DedicatedMP4Player');
        return {
          playerType: 'mp4',
          sourceInfo,
          shouldUseNewPlayer: true,
          originalUrl: url,
          processedUrl: url,
          reason: `Direct video file (${ext.toUpperCase()}) detected - using dedicated MP4 player`,
        };
      }
    }

    if (
      sourceInfo.type === 'twitter' ||
      sourceInfo.type === 'instagram' ||
      sourceInfo.type === 'tiktok'
    ) {
      console.log('[PlayerRouter] Routing to SocialMediaPlayer');
      return {
        playerType: 'socialMedia',
        sourceInfo,
        shouldUseNewPlayer: false,
        originalUrl: url,
        processedUrl: url,
        reason: 'Social media platform detected - using SocialMediaPlayer',
      };
    }

    if (
      sourceInfo.type === 'vimeo' ||
      sourceInfo.type === 'twitch' ||
      sourceInfo.type === 'facebook' ||
      sourceInfo.type === 'dailymotion' ||
      sourceInfo.type === 'rumble' ||
      sourceInfo.type === 'odysee' ||
      sourceInfo.type === 'bilibili' ||
      sourceInfo.type === 'gdrive' ||
      sourceInfo.type === 'dropbox'
    ) {
      console.log('[PlayerRouter] Routing to WebView player');
      return {
        playerType: 'webview',
        sourceInfo,
        shouldUseNewPlayer: false,
        originalUrl: url,
        processedUrl: url,
        reason: `Platform (${sourceInfo.platform}) requires WebView player`,
      };
    }

    if (sourceInfo.type === 'stream' || sourceInfo.type === 'hls' || sourceInfo.type === 'dash') {
      console.log('[PlayerRouter] Routing to native player for streaming');
      return {
        playerType: 'native',
        sourceInfo,
        shouldUseNewPlayer: false,
        originalUrl: url,
        processedUrl: url,
        reason: `Streaming format (${sourceInfo.streamType?.toUpperCase()}) detected - using native player`,
      };
    }

    console.log('[PlayerRouter] Using default WebView player');
    return {
      playerType: 'webview',
      sourceInfo,
      shouldUseNewPlayer: false,
      originalUrl: url,
      processedUrl: url,
      reason: 'Default WebView player for unknown or unsupported formats',
    };
  }

  /**
   * 检查是否应该使用新的独立播放器
   */
  public shouldUseNewPlayer(url: string): boolean {
    const result = this.route(url);
    return result.shouldUseNewPlayer;
  }

  /**
   * 获取播放器类型
   */
  public getPlayerType(url: string): PlayerType {
    const result = this.route(url);
    return result.playerType;
  }

  /**
   * 获取详细的路由信息（用于调试）
   */
  public getRouteInfo(url: string): string {
    const result = this.route(url);
    
    let info = `播放器路由信息\n\n`;
    info += `URL: ${result.originalUrl}\n\n`;
    info += `播放器类型: ${result.playerType}\n`;
    info += `源类型: ${result.sourceInfo.type}\n`;
    info += `平台: ${result.sourceInfo.platform}\n`;
    info += `使用新播放器: ${result.shouldUseNewPlayer ? '是' : '否'}\n\n`;
    info += `原因: ${result.reason}\n`;
    
    return info;
  }

  /**
   * 验证 URL 是否可播放
   */
  public canPlay(url: string): boolean {
    if (!url || url.trim() === '') {
      return false;
    }

    const result = this.route(url);
    
    if (result.playerType === 'unknown') {
      return false;
    }

    if (result.sourceInfo.type === 'unsupported') {
      return false;
    }

    return true;
  }
}

export const playerRouter = PlayerRouter.getInstance();
