export interface MP4ValidationResult {
  isValid: boolean;
  error?: string;
  contentType?: string;
  contentLength?: number;
  supportsRange?: boolean;
  redirectUrl?: string;
  headers?: Record<string, string>;
}

export interface CodecInfo {
  videoCodec?: string;
  audioCodec?: string;
  container?: string;
  supported: boolean;
  requiresSoftwareDecoding?: boolean;
  errorMessage?: string;
}

const SUPPORTED_CODECS = {
  video: ['h264', 'avc', 'avc1', 'h.264'],
  audio: ['aac', 'mp3', 'opus', 'vorbis'],
  containers: ['mp4', 'webm', 'ogg', 'm4v'],
};

const UNSUPPORTED_CODECS = {
  video: ['h265', 'hevc', 'vp8', 'vp9', 'av1', 'mpeg4', 'divx', 'xvid'],
  audio: ['ac3', 'eac3', 'dts', 'truehd'],
};

export async function validateMP4Url(url: string, timeout: number = 10000): Promise<MP4ValidationResult> {
  console.log('[MP4PlayerHelper] Validating URL:', url);
  
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return {
      isValid: false,
      error: 'URL is empty or invalid',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'Range': 'bytes=0-1',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'video/*,*/*;q=0.8',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[MP4PlayerHelper] HEAD response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url,
    });

    if (response.status === 404) {
      return {
        isValid: false,
        error: 'Video file not found (404). The file may have been deleted or the URL is incorrect.',
      };
    }

    if (response.status === 403) {
      return {
        isValid: false,
        error: 'Access denied (403). The server is blocking access to this video. This may be due to:\n• Hotlink protection\n• Geo-blocking\n• Authentication required\n• Referrer restrictions',
      };
    }

    if (response.status >= 400) {
      return {
        isValid: false,
        error: `HTTP error ${response.status}: ${response.statusText}`,
      };
    }

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    const acceptRanges = response.headers.get('accept-ranges');
    const finalUrl = response.url;

    console.log('[MP4PlayerHelper] Video metadata:', {
      contentType,
      contentLength,
      acceptRanges,
      supportsRange: acceptRanges === 'bytes' || response.status === 206,
      redirected: url !== finalUrl,
      finalUrl,
    });

    if (!contentType || !contentType.includes('video')) {
      console.warn('[MP4PlayerHelper] Content-Type is not video:', contentType);
      if (contentType === 'application/octet-stream') {
        console.log('[MP4PlayerHelper] Content-Type is octet-stream, may still be playable');
      } else if (contentType && contentType.includes('text/html')) {
        return {
          isValid: false,
          error: 'URL points to a web page, not a video file. Please provide a direct video URL.',
        };
      }
    }

    const supportsRange = acceptRanges === 'bytes' || response.status === 206;

    if (!supportsRange) {
      console.warn('[MP4PlayerHelper] Server does not support Range requests');
      console.warn('[MP4PlayerHelper] This may cause issues with seeking and loading large videos');
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Accept': 'video/*,*/*;q=0.8',
    };

    if (supportsRange) {
      headers['Range'] = 'bytes=0-';
    }

    return {
      isValid: true,
      contentType: contentType || undefined,
      contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
      supportsRange,
      redirectUrl: url !== finalUrl ? finalUrl : undefined,
      headers,
    };
  } catch (error) {
    console.error('[MP4PlayerHelper] Validation error:', error);
    
    if ((error as Error).name === 'AbortError') {
      return {
        isValid: false,
        error: `Connection timeout after ${timeout / 1000}s. The server is not responding. Please check:\n• Your internet connection\n• The video URL is correct\n• The server is accessible`,
      };
    }

    if ((error as Error).message?.includes('Network request failed')) {
      return {
        isValid: false,
        error: 'Network request failed. Please check:\n• Your internet connection\n• The URL is accessible\n• CORS or firewall is not blocking the request',
      };
    }

    return {
      isValid: false,
      error: `Failed to validate video URL: ${(error as Error).message}`,
    };
  }
}

export function detectCodecFromUrl(url: string): CodecInfo {
  console.log('[MP4PlayerHelper] Detecting codec from URL:', url);
  
  const lowerUrl = url.toLowerCase();
  
  const container = SUPPORTED_CODECS.containers.find(ext => 
    lowerUrl.includes(`.${ext}`)
  );

  const result: CodecInfo = {
    container,
    supported: true,
  };

  for (const codec of UNSUPPORTED_CODECS.video) {
    if (lowerUrl.includes(codec)) {
      result.videoCodec = codec.toUpperCase();
      result.supported = false;
      result.requiresSoftwareDecoding = true;
      result.errorMessage = `This video uses ${codec.toUpperCase()} codec which is not supported by most devices. Supported codecs: H.264/AVC only.`;
      console.warn('[MP4PlayerHelper] Unsupported video codec detected:', codec);
      break;
    }
  }

  for (const codec of UNSUPPORTED_CODECS.audio) {
    if (lowerUrl.includes(codec)) {
      result.audioCodec = codec.toUpperCase();
      result.supported = false;
      result.requiresSoftwareDecoding = true;
      result.errorMessage = result.errorMessage 
        ? result.errorMessage + `\n\nAudio codec ${codec.toUpperCase()} is also not supported.`
        : `This video uses ${codec.toUpperCase()} audio codec which is not supported. Supported codecs: AAC, MP3, Opus.`;
      console.warn('[MP4PlayerHelper] Unsupported audio codec detected:', codec);
      break;
    }
  }

  if (result.supported) {
    console.log('[MP4PlayerHelper] Codec appears to be supported');
  }

  return result;
}

export function getVideoSourceWithHeaders(url: string, headers?: Record<string, string>) {
  const finalHeaders = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Accept': 'video/*,*/*;q=0.8',
    'Range': 'bytes=0-',
    ...headers,
  };

  console.log('[MP4PlayerHelper] Preparing video source with headers:', {
    url,
    headers: finalHeaders,
  });

  return {
    uri: url,
    headers: finalHeaders,
  };
}

export async function getOptimalVideoUrl(url: string): Promise<string> {
  console.log('[MP4PlayerHelper] Getting optimal URL for:', url);
  
  try {
    const validation = await validateMP4Url(url);
    
    if (!validation.isValid) {
      console.error('[MP4PlayerHelper] URL validation failed:', validation.error);
      throw new Error(validation.error);
    }

    if (validation.redirectUrl) {
      console.log('[MP4PlayerHelper] Using redirected URL:', validation.redirectUrl);
      return validation.redirectUrl;
    }

    return url;
  } catch (error) {
    console.error('[MP4PlayerHelper] Failed to get optimal URL:', error);
    return url;
  }
}

export function getDiagnosticInfo(url: string, error?: any): string {
  const codecInfo = detectCodecFromUrl(url);
  
  let diagnostic = `🔍 視頻診斷報告\n\n`;
  diagnostic += `URL: ${url}\n\n`;
  
  if (codecInfo.container) {
    diagnostic += `📦 容器格式: ${codecInfo.container.toUpperCase()}\n`;
  }
  
  if (codecInfo.videoCodec) {
    diagnostic += `🎬 視頻編碼: ${codecInfo.videoCodec}\n`;
  }
  
  if (codecInfo.audioCodec) {
    diagnostic += `🔊 音訊編碼: ${codecInfo.audioCodec}\n`;
  }
  
  diagnostic += `\n`;
  
  if (!codecInfo.supported) {
    diagnostic += `❌ 不支援原因:\n${codecInfo.errorMessage}\n\n`;
    diagnostic += `✅ 建議解決方案:\n`;
    diagnostic += `1. 使用支援的格式重新編碼視頻\n`;
    diagnostic += `2. 使用 H.264 視頻編碼 + AAC 音訊編碼\n`;
    diagnostic += `3. 使用 MP4 容器格式\n`;
    diagnostic += `4. 確保 moov atom 在檔案開頭（fast start）\n`;
  } else {
    diagnostic += `✅ 編碼格式: 支援\n\n`;
  }
  
  if (error) {
    diagnostic += `\n🔴 播放錯誤:\n${error}\n`;
  }
  
  return diagnostic;
}
