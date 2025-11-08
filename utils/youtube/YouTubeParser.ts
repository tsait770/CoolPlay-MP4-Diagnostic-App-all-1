/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * YouTube Parser Module (解析/读取通道)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 职责：
 * - YouTube URL 识别与解析
 * - 视频 ID 提取
 * - URL 格式验证
 * - 提供 embed URL 生成逻辑
 * 
 * ⚠️ 重要限制：
 * - 本模块仅负责解析，不涉及播放控制
 * - 不得直接触发任何播放相关操作
 * - 不得访问或修改全局状态
 * - 保持纯函数设计
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export interface YouTubeVideoInfo {
  videoId: string;
  url: string;
  type: 'video' | 'live' | 'shorts' | 'playlist';
  timestamp?: number;
  playlistId?: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface YouTubeEmbedOptions {
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  modestbranding?: boolean;
  playsinline?: boolean;
  rel?: boolean;
  enablejsapi?: boolean;
  origin?: string;
  start?: number;
}

export class YouTubeParser {
  private static instance: YouTubeParser;

  private constructor() {
    console.log('[YouTubeParser] ✅ Parser module initialized (read-only)');
  }

  public static getInstance(): YouTubeParser {
    if (!YouTubeParser.instance) {
      YouTubeParser.instance = new YouTubeParser();
    }
    return YouTubeParser.instance;
  }

  /**
   * 验证是否为 YouTube URL
   */
  public isYouTubeUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const patterns = [
      /youtube\.com/i,
      /youtu\.be/i,
      /youtube-nocookie\.com/i,
    ];

    return patterns.some(pattern => pattern.test(url));
  }

  /**
   * 从 URL 提取视频 ID
   * 支持所有 YouTube URL 格式
   */
  public extractVideoId(url: string): string | null {
    if (!url || typeof url !== 'string') {
      console.error('[YouTubeParser] Invalid URL provided');
      return null;
    }

    const patterns = [
      /(?:youtube\.com\/watch\?.*v=)([\w-]{11})/i,
      /(?:youtu\.be\/)([\w-]{11})/i,
      /(?:youtube\.com\/embed\/)([\w-]{11})/i,
      /(?:youtube\.com\/v\/)([\w-]{11})/i,
      /(?:youtube\.com\/shorts\/)([\w-]{11})/i,
      /(?:youtube-nocookie\.com\/embed\/)([\w-]{11})/i,
      /(?:youtube\.com\/live\/)([\w-]{11})/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1] && match[1].length === 11) {
        console.log('[YouTubeParser] ✅ Video ID extracted:', match[1]);
        return match[1];
      }
    }

    console.warn('[YouTubeParser] ❌ Could not extract video ID from:', url);
    return null;
  }

  /**
   * 解析 YouTube URL 并提取完整信息
   */
  public parse(url: string): YouTubeVideoInfo {
    console.log('[YouTubeParser] Parsing URL:', url);

    if (!url || typeof url !== 'string' || url.trim() === '') {
      return {
        videoId: '',
        url: '',
        type: 'video',
        isValid: false,
        errorMessage: 'URL is empty or invalid',
      };
    }

    if (!this.isYouTubeUrl(url)) {
      return {
        videoId: '',
        url: url,
        type: 'video',
        isValid: false,
        errorMessage: 'Not a YouTube URL',
      };
    }

    const videoId = this.extractVideoId(url);

    if (!videoId) {
      return {
        videoId: '',
        url: url,
        type: 'video',
        isValid: false,
        errorMessage: 'Could not extract video ID',
      };
    }

    let type: 'video' | 'live' | 'shorts' | 'playlist' = 'video';
    
    if (url.includes('/shorts/')) {
      type = 'shorts';
    } else if (url.includes('/live/')) {
      type = 'live';
    } else if (url.includes('list=')) {
      type = 'playlist';
    }

    const timestampMatch = url.match(/[?&]t=(\d+)/);
    const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : undefined;

    const playlistMatch = url.match(/[?&]list=([\w-]+)/);
    const playlistId = playlistMatch ? playlistMatch[1] : undefined;

    console.log('[YouTubeParser] ✅ Parse result:', {
      videoId,
      type,
      timestamp,
      playlistId,
    });

    return {
      videoId,
      url,
      type,
      timestamp,
      playlistId,
      isValid: true,
    };
  }

  /**
   * 生成 YouTube embed URL
   */
  public generateEmbedUrl(
    videoId: string,
    options: YouTubeEmbedOptions = {}
  ): string {
    const defaults: YouTubeEmbedOptions = {
      autoplay: false,
      controls: true,
      loop: false,
      muted: false,
      modestbranding: true,
      playsinline: true,
      rel: false,
      enablejsapi: true,
      origin: 'https://rork.app',
    };

    const finalOptions = { ...defaults, ...options };

    const params = new URLSearchParams({
      autoplay: finalOptions.autoplay ? '1' : '0',
      playsinline: finalOptions.playsinline ? '1' : '0',
      controls: finalOptions.controls ? '1' : '0',
      loop: finalOptions.loop ? '1' : '0',
      mute: finalOptions.muted ? '1' : '0',
      rel: finalOptions.rel ? '1' : '0',
      modestbranding: finalOptions.modestbranding ? '1' : '0',
      fs: '1',
      enablejsapi: finalOptions.enablejsapi ? '1' : '0',
      iv_load_policy: '3',
      cc_load_policy: '0',
      disablekb: '0',
      hl: 'en',
    });

    if (finalOptions.origin) {
      params.append('origin', finalOptions.origin);
      params.append('widget_referrer', finalOptions.origin);
    }

    if (finalOptions.start) {
      params.append('start', finalOptions.start.toString());
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;

    console.log('[YouTubeParser] Generated embed URL:', embedUrl);

    return embedUrl;
  }

  /**
   * 生成多个 fallback embed URLs（用于重试策略）
   */
  public generateFallbackUrls(
    videoId: string,
    options: YouTubeEmbedOptions = {}
  ): string[] {
    const baseParams: Record<string, string> = {
      autoplay: options.autoplay ? '1' : '0',
      playsinline: '1',
      controls: options.controls !== false ? '1' : '0',
      rel: '0',
      modestbranding: '1',
      fs: '1',
    };

    if (options.start) {
      baseParams.start = options.start.toString();
    }

    const strategies = [
      {
        domain: 'www.youtube.com',
        params: {
          ...baseParams,
          enablejsapi: '1',
          origin: 'https://rork.app',
          widget_referrer: 'https://rork.app',
          iv_load_policy: '3',
          cc_load_policy: '0',
          disablekb: '0',
          hl: 'en',
        },
      },
      {
        domain: 'www.youtube-nocookie.com',
        params: {
          ...baseParams,
          enablejsapi: '1',
          origin: 'https://rork.app',
          iv_load_policy: '3',
        },
      },
      {
        domain: 'www.youtube.com',
        params: {
          ...baseParams,
          hl: 'en',
        },
      },
      {
        domain: 'www.youtube-nocookie.com',
        params: baseParams,
      },
    ];

    const urls = strategies.map(strategy => {
      const params = new URLSearchParams(strategy.params);
      return `https://${strategy.domain}/embed/${videoId}?${params.toString()}`;
    });

    console.log('[YouTubeParser] Generated', urls.length, 'fallback URLs');

    return urls;
  }

  /**
   * 验证视频 ID 格式
   */
  public isValidVideoId(videoId: string): boolean {
    if (!videoId || typeof videoId !== 'string') {
      return false;
    }

    return /^[\w-]{11}$/.test(videoId);
  }

  /**
   * 从任何 YouTube URL 直接获取 embed URL
   */
  public urlToEmbed(url: string, options?: YouTubeEmbedOptions): string | null {
    const parsed = this.parse(url);

    if (!parsed.isValid || !parsed.videoId) {
      console.error('[YouTubeParser] Cannot convert invalid URL to embed:', url);
      return null;
    }

    const embedOptions: YouTubeEmbedOptions = {
      ...options,
      start: parsed.timestamp || options?.start,
    };

    return this.generateEmbedUrl(parsed.videoId, embedOptions);
  }

  /**
   * 获取视频缩略图 URL
   */
  public getThumbnailUrl(videoId: string, quality: 'default' | 'hq' | 'mq' | 'sd' | 'maxres' = 'hq'): string {
    const qualityMap = {
      default: 'default',
      mq: 'mqdefault',
      hq: 'hqdefault',
      sd: 'sddefault',
      maxres: 'maxresdefault',
    };

    return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
  }
}

export const youtubeParser = YouTubeParser.getInstance();
