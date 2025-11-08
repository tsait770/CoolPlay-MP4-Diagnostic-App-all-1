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
      autoplay: config.autoplay ? '1' : '0',
      playsinline: '1',
      controls: config.controls !== false ? '1' : '0',
      loop: config.loop ? '1' : '0',
      mute: config.muted ? '1' : '0',
      rel: '0',
      modestbranding: '1',
      fs: '1',
      enablejsapi: '1',
      iv_load_policy: '3',
      cc_load_policy: '0',
      disablekb: '0',
      hl: 'en',
      origin: 'https://rork.app',
      widget_referrer: 'https://rork.app',
    });

    const embedUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;

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

    const strategies: {domain: string; params: Record<string, string>}[] = [
      {
        domain: 'www.youtube.com',
        params: {
          autoplay: config.autoplay ? '1' : '0',
          playsinline: '1',
          controls: config.controls !== false ? '1' : '0',
          loop: config.loop ? '1' : '0',
          mute: config.muted ? '1' : '0',
          rel: '0',
          modestbranding: '1',
          fs: '1',
          enablejsapi: '1',
          iv_load_policy: '3',
          cc_load_policy: '0',
          disablekb: '0',
          hl: 'en',
          origin: 'https://rork.app',
          widget_referrer: 'https://rork.app',
        },
      },
      {
        domain: 'www.youtube-nocookie.com',
        params: {
          autoplay: config.autoplay ? '1' : '0',
          playsinline: '1',
          controls: config.controls !== false ? '1' : '0',
          loop: config.loop ? '1' : '0',
          mute: config.muted ? '1' : '0',
          rel: '0',
          modestbranding: '1',
          fs: '1',
          enablejsapi: '1',
          iv_load_policy: '3',
          origin: 'https://rork.app',
        },
      },
      {
        domain: 'www.youtube.com',
        params: {
          autoplay: config.autoplay ? '1' : '0',
          playsinline: '1',
          controls: '1',
          rel: '0',
          modestbranding: '1',
          fs: '1',
          hl: 'en',
        },
      },
      {
        domain: 'www.youtube-nocookie.com',
        params: {
          autoplay: config.autoplay ? '1' : '0',
          playsinline: '1',
          controls: '1',
          rel: '0',
          fs: '1',
        },
      },
      {
        domain: 'invidious.snopyta.org',
        params: {
          autoplay: config.autoplay ? '1' : '0',
          loop: config.loop ? '1' : '0',
        },
      },
    ];

    const strategyIndex = attemptNumber % strategies.length;
    const strategy = strategies[strategyIndex];
    const params = new URLSearchParams(Object.entries(strategy.params));
    const embedUrl = `https://${strategy.domain}/embed/${videoId}?${params.toString()}`;

    console.log('[YouTubePlayerModule] Generated fallback embed URL:', embedUrl);
    console.log('[YouTubePlayerModule] Using strategy:', strategyIndex + 1, '/', strategies.length);

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
      incognito: false,
      setSupportMultipleWindows: false,
    };

    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    ];

    const userAgent = userAgents[attemptNumber % userAgents.length];

    const headers: Record<string, string> = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.youtube.com/',
      'Origin': 'https://rork.app',
      'DNT': '1',
      'Sec-Fetch-Dest': 'iframe',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
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
        var logPrefix = '[YouTube Player Injected]';
        console.log(logPrefix, 'Script injected and executing');
        
        window.addEventListener('error', function(e) {
          console.log(logPrefix, 'Error caught:', e.message);
          return true;
        }, true);
        
        window.onerror = function(msg, url, lineNo, columnNo, error) {
          console.log(logPrefix, 'Global error:', msg);
          return true;
        };
        
        window.addEventListener('unhandledrejection', function(event) {
          console.log(logPrefix, 'Unhandled rejection:', event.reason);
          return true;
        });
        
        var attempts = 0;
        var maxAttempts = 30;
        
        function styleIframes() {
          attempts++;
          console.log(logPrefix, 'Styling attempt:', attempts);
          
          try {
            if (document.body) {
              document.body.style.margin = '0';
              document.body.style.padding = '0';
              document.body.style.overflow = 'hidden';
              document.body.style.backgroundColor = '#000';
            }
            
            if (document.documentElement) {
              document.documentElement.style.overflow = 'hidden';
              document.documentElement.style.backgroundColor = '#000';
            }
            
            var iframes = document.querySelectorAll('iframe');
            console.log(logPrefix, 'Found iframes:', iframes.length);
            
            if (iframes.length > 0) {
              for (var i = 0; i < iframes.length; i++) {
                var iframe = iframes[i];
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                iframe.style.position = 'absolute';
                iframe.style.top = '0';
                iframe.style.left = '0';
                iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.setAttribute('webkitallowfullscreen', 'true');
                iframe.setAttribute('mozallowfullscreen', 'true');
              }
              
              console.log(logPrefix, 'iframes styled successfully');
              
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'playerReady',
                  timestamp: Date.now(),
                  iframeCount: iframes.length
                }));
              }
              
              return true;
            }
          } catch (e) {
            console.error(logPrefix, 'Error styling iframes:', e);
          }
          
          if (attempts < maxAttempts) {
            setTimeout(styleIframes, 200);
          } else {
            console.warn(logPrefix, 'Max attempts reached, no iframes found');
          }
          
          return false;
        }
        
        setTimeout(styleIframes, 500);
        
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
