/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * MP4 Player Module (专用MP4播放模块)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 职责：
 * - MP4 URL 验证
 * - 编解码器检测
 * - 生成诊断信息
 * 
 * ⚠️ 重要限制：
 * - 仅负责 MP4 相关功能
 * - 不得干扰其他播放器模块
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export interface MP4ValidationResult {
  isValid: boolean;
  canPlay: boolean;
  errorMessage?: string;
  contentType?: string;
  contentLength?: number;
  supportsRange?: boolean;
  redirectUrl?: string;
}

export interface MP4CodecInfo {
  videoCodec?: string;
  audioCodec?: string;
  container?: string;
  supported: boolean;
  requiresSoftwareDecoding?: boolean;
  errorMessage?: string;
}

export class MP4PlayerModule {
  private static instance: MP4PlayerModule;

  private readonly SUPPORTED_CODECS = {
    video: ['h264', 'avc', 'avc1', 'h.264'],
    audio: ['aac', 'mp3', 'opus', 'vorbis'],
    containers: ['mp4', 'webm', 'ogg', 'm4v'],
  };

  private readonly UNSUPPORTED_CODECS = {
    video: ['h265', 'hevc', 'vp8', 'vp9', 'av1', 'mpeg4', 'divx', 'xvid'],
    audio: ['ac3', 'eac3', 'dts', 'truehd'],
  };

  private constructor() {
    console.log('[MP4PlayerModule] ✅ Module initialized');
  }

  public static getInstance(): MP4PlayerModule {
    if (!MP4PlayerModule.instance) {
      MP4PlayerModule.instance = new MP4PlayerModule();
    }
    return MP4PlayerModule.instance;
  }

  /**
   * 验证 MP4 URL
   */
  public async validateMP4Url(url: string, timeout: number = 10000): Promise<MP4ValidationResult> {
    console.log('[MP4PlayerModule] Validating URL:', url);
    
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return {
        isValid: false,
        canPlay: false,
        errorMessage: 'URL is empty or invalid',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'Range': 'bytes=0-1',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
          'Accept': 'video/*,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('[MP4PlayerModule] HEAD response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });

      if (response.status === 404) {
        return {
          isValid: false,
          canPlay: false,
          errorMessage: 'Video file not found (404)',
        };
      }

      if (response.status === 403) {
        return {
          isValid: false,
          canPlay: false,
          errorMessage: 'Access denied (403)',
        };
      }

      if (response.status >= 400) {
        return {
          isValid: false,
          canPlay: false,
          errorMessage: `HTTP error ${response.status}`,
        };
      }

      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      const acceptRanges = response.headers.get('accept-ranges');
      const finalUrl = response.url;

      const supportsRange = acceptRanges === 'bytes' || response.status === 206;

      if (!contentType || !contentType.includes('video')) {
        console.warn('[MP4PlayerModule] Content-Type is not video:', contentType);
        
        if (contentType && contentType.includes('text/html')) {
          return {
            isValid: false,
            canPlay: false,
            errorMessage: 'URL points to a web page, not a video file',
          };
        }
      }

      return {
        isValid: true,
        canPlay: true,
        contentType: contentType || undefined,
        contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
        supportsRange,
        redirectUrl: url !== finalUrl ? finalUrl : undefined,
      };
    } catch (error) {
      console.error('[MP4PlayerModule] Validation error:', error);
      
      if ((error as Error).name === 'AbortError') {
        return {
          isValid: false,
          canPlay: false,
          errorMessage: `Connection timeout after ${timeout / 1000}s`,
        };
      }

      return {
        isValid: false,
        canPlay: false,
        errorMessage: `Failed to validate video: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 检测视频编解码器
   */
  public detectCodec(url: string): MP4CodecInfo {
    console.log('[MP4PlayerModule] Detecting codec from URL:', url);
    
    const lowerUrl = url.toLowerCase();
    
    const container = this.SUPPORTED_CODECS.containers.find(ext => 
      lowerUrl.includes(`.${ext}`)
    );

    const result: MP4CodecInfo = {
      container,
      supported: true,
    };

    for (const codec of this.UNSUPPORTED_CODECS.video) {
      if (lowerUrl.includes(codec)) {
        result.videoCodec = codec.toUpperCase();
        result.supported = false;
        result.requiresSoftwareDecoding = true;
        result.errorMessage = `Video uses ${codec.toUpperCase()} codec which is not supported by most devices. Supported: H.264/AVC only.`;
        console.warn('[MP4PlayerModule] Unsupported video codec:', codec);
        break;
      }
    }

    for (const codec of this.UNSUPPORTED_CODECS.audio) {
      if (lowerUrl.includes(codec)) {
        result.audioCodec = codec.toUpperCase();
        result.supported = false;
        result.requiresSoftwareDecoding = true;
        result.errorMessage = result.errorMessage 
          ? result.errorMessage + `\n\nAudio codec ${codec.toUpperCase()} is also not supported.`
          : `Audio codec ${codec.toUpperCase()} is not supported. Supported: AAC, MP3, Opus.`;
        console.warn('[MP4PlayerModule] Unsupported audio codec:', codec);
        break;
      }
    }

    if (result.supported) {
      console.log('[MP4PlayerModule] Codec appears to be supported');
    }

    return result;
  }

  /**
   * 生成诊断信息
   */
  public generateDiagnosticInfo(url: string, error?: string): string {
    const codecInfo = this.detectCodec(url);
    
    let diagnostic = `🔍 MP4 视频诊断报告\n\n`;
    diagnostic += `URL: ${url}\n\n`;
    
    if (codecInfo.container) {
      diagnostic += `📦 容器格式: ${codecInfo.container.toUpperCase()}\n`;
    }
    
    if (codecInfo.videoCodec) {
      diagnostic += `🎬 视频编码: ${codecInfo.videoCodec}\n`;
    }
    
    if (codecInfo.audioCodec) {
      diagnostic += `🔊 音频编码: ${codecInfo.audioCodec}\n`;
    }
    
    diagnostic += `\n`;
    
    if (!codecInfo.supported) {
      diagnostic += `❌ 不支持原因:\n${codecInfo.errorMessage}\n\n`;
      diagnostic += `✅ 建议解决方案:\n`;
      diagnostic += `1. 使用 H.264 视频编码 + AAC 音频编码\n`;
      diagnostic += `2. 使用 MP4 容器格式\n`;
      diagnostic += `3. 确保 moov atom 在文件开头（fast start）\n`;
    } else {
      diagnostic += `✅ 编码格式: 支持\n\n`;
    }
    
    if (error) {
      diagnostic += `\n🔴 播放错误:\n${error}\n`;
    }
    
    return diagnostic;
  }
}

export const mp4PlayerModule = MP4PlayerModule.getInstance();
