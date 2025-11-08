/**
 * 独立的 MP4 播放器模块
 * 专门处理 MP4 和直接视频文件播放
 * 完全独立的架构，不影响其他播放器
 */

export interface MP4ValidationResult {
  isValid: boolean;
  canPlay: boolean;
  supportsRange: boolean;
  contentType: string | null;
  contentLength: number | null;
  redirectUrl: string | null;
  errorMessage: string | null;
  statusCode: number | null;
}

export interface MP4CodecInfo {
  supported: boolean;
  codec: string;
  container: string;
  errorMessage: string | null;
  recommendation: string | null;
}

export interface MP4PlayerConfig {
  url: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  headers?: Record<string, string>;
}

export class MP4PlayerModule {
  private static instance: MP4PlayerModule;

  private constructor() {
    console.log('[MP4PlayerModule] Initialized');
  }

  public static getInstance(): MP4PlayerModule {
    if (!MP4PlayerModule.instance) {
      MP4PlayerModule.instance = new MP4PlayerModule();
    }
    return MP4PlayerModule.instance;
  }

  /**
   * 验证 MP4 URL 是否可播放
   */
  public async validateMP4Url(url: string): Promise<MP4ValidationResult> {
    console.log('[MP4PlayerModule] Validating URL:', url);

    const defaultResult: MP4ValidationResult = {
      isValid: false,
      canPlay: false,
      supportsRange: false,
      contentType: null,
      contentLength: null,
      redirectUrl: null,
      errorMessage: null,
      statusCode: null,
    };

    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.error('[MP4PlayerModule] Invalid URL: empty or not a string');
      return {
        ...defaultResult,
        errorMessage: 'Invalid URL: URL is empty',
      };
    }

    const trimmedUrl = url.trim();

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      console.error('[MP4PlayerModule] Invalid URL: must start with http:// or https://');
      return {
        ...defaultResult,
        errorMessage: 'Invalid URL: must be HTTP or HTTPS',
      };
    }

    try {
      console.log('[MP4PlayerModule] Sending HEAD request to:', trimmedUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(trimmedUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'Range': 'bytes=0-',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
      });

      clearTimeout(timeoutId);

      console.log('[MP4PlayerModule] Response status:', response.status);
      console.log('[MP4PlayerModule] Response headers:', Object.fromEntries(response.headers.entries()));

      const contentType = response.headers.get('content-type') || response.headers.get('Content-Type');
      const contentLength = response.headers.get('content-length') || response.headers.get('Content-Length');
      const acceptRanges = response.headers.get('accept-ranges') || response.headers.get('Accept-Ranges');

      const supportsRange = acceptRanges === 'bytes';
      const finalUrl = response.url || trimmedUrl;

      if (response.status >= 200 && response.status < 300) {
        const canPlay = this.isPlayableContentType(contentType);

        if (!canPlay) {
          console.warn('[MP4PlayerModule] Content-Type not playable:', contentType);
        }

        if (!supportsRange) {
          console.warn('[MP4PlayerModule] Server does not support Range requests');
        }

        return {
          isValid: true,
          canPlay,
          supportsRange,
          contentType,
          contentLength: contentLength ? parseInt(contentLength, 10) : null,
          redirectUrl: finalUrl !== trimmedUrl ? finalUrl : null,
          errorMessage: canPlay ? null : `Unsupported content type: ${contentType}`,
          statusCode: response.status,
        };
      } else {
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        console.error('[MP4PlayerModule]', errorMessage);

        return {
          ...defaultResult,
          errorMessage,
          statusCode: response.status,
        };
      }
    } catch (error: any) {
      console.error('[MP4PlayerModule] Validation error:', error);

      let errorMessage = 'Unknown error';

      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout: Server took too long to respond';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        ...defaultResult,
        errorMessage: `Validation failed: ${errorMessage}`,
      };
    }
  }

  /**
   * 检测视频编解码器
   */
  public detectCodec(url: string): MP4CodecInfo {
    console.log('[MP4PlayerModule] Detecting codec for:', url);

    const urlLower = url.toLowerCase();

    const supportedExtensions = [
      '.mp4', '.m4v', '.mov',
      '.webm', '.ogg', '.ogv',
    ];

    const unsupportedExtensions = [
      '.mkv', '.avi', '.wmv', '.flv',
      '.3gp', '.ts', '.m2ts', '.mts',
    ];

    const h265Extensions = ['.hevc', '.h265'];

    for (const ext of h265Extensions) {
      if (urlLower.includes(ext)) {
        return {
          supported: false,
          codec: 'H.265/HEVC',
          container: 'MP4',
          errorMessage: 'H.265/HEVC codec is not widely supported on mobile devices',
          recommendation: 'Use H.264 encoded videos for best compatibility',
        };
      }
    }

    for (const ext of unsupportedExtensions) {
      if (urlLower.endsWith(ext)) {
        const container = ext.substring(1).toUpperCase();
        return {
          supported: false,
          codec: 'Unknown',
          container,
          errorMessage: `${container} format is not supported by native video players`,
          recommendation: 'Convert video to MP4 with H.264 codec',
        };
      }
    }

    for (const ext of supportedExtensions) {
      if (urlLower.endsWith(ext)) {
        const container = ext.substring(1).toUpperCase();
        return {
          supported: true,
          codec: 'H.264 (assumed)',
          container,
          errorMessage: null,
          recommendation: null,
        };
      }
    }

    return {
      supported: true,
      codec: 'Unknown',
      container: 'Unknown',
      errorMessage: null,
      recommendation: null,
    };
  }

  /**
   * 判断 Content-Type 是否可播放
   */
  private isPlayableContentType(contentType: string | null): boolean {
    if (!contentType) {
      return false;
    }

    const playableTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-m4v',
      'application/vnd.apple.mpegurl',
      'application/x-mpegurl',
    ];

    const contentTypeLower = contentType.toLowerCase();

    return playableTypes.some(type => contentTypeLower.includes(type));
  }

  /**
   * 生成诊断信息
   */
  public generateDiagnosticInfo(url: string, error?: string): string {
    const codecInfo = this.detectCodec(url);
    
    let diagnostic = `MP4 播放器诊断信息\n\n`;
    diagnostic += `URL: ${url}\n\n`;
    
    if (codecInfo.container !== 'Unknown') {
      diagnostic += `格式: ${codecInfo.container}\n`;
    }
    
    if (codecInfo.codec !== 'Unknown') {
      diagnostic += `编解码器: ${codecInfo.codec}\n`;
    }
    
    diagnostic += `支持状态: ${codecInfo.supported ? '✓ 支持' : '✗ 不支持'}\n\n`;
    
    if (codecInfo.errorMessage) {
      diagnostic += `问题: ${codecInfo.errorMessage}\n\n`;
    }
    
    if (codecInfo.recommendation) {
      diagnostic += `建议: ${codecInfo.recommendation}\n\n`;
    }
    
    if (error) {
      diagnostic += `错误详情: ${error}\n\n`;
    }
    
    diagnostic += `故障排除步骤:\n`;
    diagnostic += `1. 确认视频文件格式为 MP4 (H.264)\n`;
    diagnostic += `2. 检查视频 URL 是否可访问\n`;
    diagnostic += `3. 确认服务器支持 Range 请求\n`;
    diagnostic += `4. 验证 Content-Type 为 video/mp4\n`;
    
    return diagnostic;
  }

  /**
   * 获取推荐的请求头
   */
  public getRecommendedHeaders(): Record<string, string> {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
      'Accept-Language': 'en-US,en;q=0.9',
      'Range': 'bytes=0-',
    };
  }

  /**
   * 检查 URL 是否是 MP4 相关格式
   */
  public isMP4RelatedFormat(url: string): boolean {
    const mp4Extensions = [
      '.mp4', '.m4v', '.mov',
      '.webm', '.ogg', '.ogv',
    ];

    const urlLower = url.toLowerCase();
    return mp4Extensions.some(ext => urlLower.endsWith(ext));
  }

  /**
   * 获取视频文件扩展名
   */
  public getVideoExtension(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const match = pathname.match(/\.([a-z0-9]+)$/i);
      return match ? match[1].toLowerCase() : null;
    } catch {
      return null;
    }
  }
}

export const mp4PlayerModule = MP4PlayerModule.getInstance();
