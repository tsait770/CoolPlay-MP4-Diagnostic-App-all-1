/**
 * 独立的 YouTube 播放器模块
 * 专门处理 YouTube 视频播放
 * 完全独立的架构，不影响其他播放器
 */

export interface YouTubePlayerConfig {
  url: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export interface YouTubeEmbedResult {
  embedUrl: string;
  videoId: string;
  isValid: boolean;
  errorMessage?: string;
}

export class YouTubePlayerModule {
  private static instance: YouTubePlayerModule;

  private constructor() {
    console.log('[YouTubePlayerModule] Initialized');
  }

  public static getInstance(): YouTubePlayerModule {
    if (!YouTubePlayerModule.instance) {
      YouTubePlayerModule.instance = new YouTubePlayerModule();
    }
    return YouTubePlayerModule.instance;
  }

  /**
   * 从各种 YouTube URL 格式提取视频 ID
   */
  public extractVideoId(url: string): string | null {
    if (!url || typeof url !== 'string') {
      console.error('[YouTubePlayerModule] Invalid URL provided');
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
      if (match && match[1]) {
        console.log('[YouTubePlayerModule] Extracted video ID:', match[1]);
        return match[1];
      }
    }

    console.warn('[YouTubePlayerModule] Could not extract video ID from URL:', url);
    return null;
  }

  /**
   * 验证 YouTube URL 是否有效
   */
  public isValidYouTubeUrl(url: string): boolean {
    const videoId = this.extractVideoId(url);
    return videoId !== null && videoId.length === 11;
  }

  /**
   * 生成 YouTube 嵌入 URL
   */
  public generateEmbedUrl(config: YouTubePlayerConfig): YouTubeEmbedResult {
    console.log('[YouTubePlayerModule] Generating embed URL for:', config.url);

    const videoId = this.extractVideoId(config.url);

    if (!videoId) {
      return {
        embedUrl: '',
        videoId: '',
        isValid: false,
        errorMessage: 'Invalid YouTube URL - could not extract video ID',
      };
    }

    const params = new URLSearchParams({
      playsinline: '1',
      enablejsapi: '1',
      modestbranding: '1',
      rel: '0',
      iv_load_policy: '3',
      fs: '1',
      autoplay: config.autoplay ? '1' : '0',
      controls: config.controls !== false ? '1' : '0',
      loop: config.loop ? '1' : '0',
      mute: config.muted ? '1' : '0',
    });

    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;

    console.log('[YouTubePlayerModule] Generated embed URL:', embedUrl);

    return {
      embedUrl,
      videoId,
      isValid: true,
    };
  }

  /**
   * 生成带有回退选项的嵌入 URL
   * 用于错误重试
   */
  public generateEmbedUrlWithFallback(
    config: YouTubePlayerConfig,
    attemptNumber: number = 0
  ): YouTubeEmbedResult {
    console.log('[YouTubePlayerModule] Generating embed URL with fallback, attempt:', attemptNumber);

    const videoId = this.extractVideoId(config.url);

    if (!videoId) {
      return {
        embedUrl: '',
        videoId: '',
        isValid: false,
        errorMessage: 'Invalid YouTube URL - could not extract video ID',
      };
    }

    const domains = [
      'www.youtube-nocookie.com',
      'www.youtube.com',
      'youtube.com',
    ];

    const domainIndex = attemptNumber % domains.length;
    const domain = domains[domainIndex];

    const baseParams: Record<string, string> = {
      playsinline: '1',
      enablejsapi: '1',
      modestbranding: '1',
      rel: '0',
      iv_load_policy: '3',
      fs: '1',
      autoplay: config.autoplay ? '1' : '0',
      controls: config.controls !== false ? '1' : '0',
      loop: config.loop ? '1' : '0',
      mute: config.muted ? '1' : '0',
    };

    if (attemptNumber >= 1) {
      baseParams['origin'] = 'https://rork.app';
    }

    if (attemptNumber >= 2) {
      baseParams['widget_referrer'] = 'https://rork.app';
    }

    const params = new URLSearchParams(baseParams);
    const embedUrl = `https://${domain}/embed/${videoId}?${params.toString()}`;

    console.log('[YouTubePlayerModule] Generated fallback embed URL:', embedUrl);

    return {
      embedUrl,
      videoId,
      isValid: true,
    };
  }

  /**
   * 获取推荐的 WebView 配置
   */
  public getWebViewConfig(attemptNumber: number = 0) {
    const baseConfig = {
      javaScriptEnabled: true,
      domStorageEnabled: true,
      allowsInlineMediaPlayback: true,
      mediaPlaybackRequiresUserAction: false,
      allowsFullscreenVideo: true,
      allowsProtectedMedia: true,
      mixedContentMode: 'always' as const,
      thirdPartyCookiesEnabled: true,
      sharedCookiesEnabled: true,
      cacheEnabled: true,
    };

    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    ];

    const userAgent = userAgents[attemptNumber % userAgents.length];

    const headers: Record<string, string> = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.youtube.com/',
      'DNT': '1',
      'Sec-Fetch-Dest': 'iframe',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Upgrade-Insecure-Requests': '1',
    };

    return {
      ...baseConfig,
      userAgent,
      headers,
    };
  }

  /**
   * 生成注入的 JavaScript 代码
   */
  public generateInjectedJavaScript(): string {
    return `
      (function() {
        try {
          console.log('[YouTube Player] Iframe loaded');
          
          window.addEventListener('error', function(e) {
            if (e.message === 'Script error.') {
              console.log('[YouTube Player] Cross-origin script error (expected, ignored)');
              return;
            }
            console.error('[YouTube Player] Error:', e.message);
          }, true);
          
          setTimeout(function() {
            try {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'playerReady'
                }));
              }
            } catch (err) {
              console.log('[YouTube Player] Message post skipped');
            }
          }, 2000);
          
          if (document.body) {
            document.body.style.margin = '0';
            document.body.style.padding = '0';
            document.body.style.overflow = 'hidden';
          }
          
          if (document.documentElement) {
            document.documentElement.style.overflow = 'hidden';
          }
          
        } catch (error) {
          console.log('[YouTube Player] Initialization error (ignored):', error.message);
        }
      })();
      true;
    `;
  }

  /**
   * 诊断 YouTube 错误
   */
  public diagnoseError(errorCode: number | string): string {
    const errorMessages: Record<string | number, string> = {
      2: 'Invalid video ID - The video ID in the URL is incorrect',
      4: 'Video cannot be embedded - The video owner has disabled embedding',
      5: 'HTML5 player error - Your browser does not support HTML5 video',
      15: 'Video unavailable - The video may be private, deleted, or restricted in your region',
      100: 'Video not found - The video has been removed or is unavailable',
      101: 'Video cannot be embedded - The video owner has restricted embedding',
      150: 'Video cannot be embedded - The video owner has restricted embedding',
    };

    return errorMessages[errorCode] || `Unknown YouTube error (code: ${errorCode})`;
  }
}

export const youTubePlayerModule = YouTubePlayerModule.getInstance();
