/**
 * Video Format Detector
 * Detects video format, codec, and container type
 */

export interface VideoFormatInfo {
  container: 'mp4' | 'webm' | 'mkv' | 'avi' | 'mov' | 'flv' | 'm3u8' | 'mpd' | 'unknown';
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1' | 'unknown';
  isSupported: boolean;
  requiresNativePlayer: boolean;
  requiresWebView: boolean;
  requiresFFmpeg: boolean;
  mimeType?: string;
}

/**
 * Detect video format from URL
 */
export function detectVideoFormat(url: string): VideoFormatInfo {
  if (!url || typeof url !== 'string') {
    return {
      container: 'unknown',
      isSupported: false,
      requiresNativePlayer: false,
      requiresWebView: false,
      requiresFFmpeg: false,
    };
  }

  const lowerUrl = url.toLowerCase();

  // MP4 - Most common, widely supported
  if (lowerUrl.includes('.mp4') || lowerUrl.includes('video/mp4')) {
    return {
      container: 'mp4',
      codec: 'h264',
      mimeType: 'video/mp4',
      isSupported: true,
      requiresNativePlayer: true,
      requiresWebView: false,
      requiresFFmpeg: false,
    };
  }

  // WebM - Modern format
  if (lowerUrl.includes('.webm') || lowerUrl.includes('video/webm')) {
    return {
      container: 'webm',
      codec: 'vp9',
      mimeType: 'video/webm',
      isSupported: true,
      requiresNativePlayer: true,
      requiresWebView: false,
      requiresFFmpeg: false,
    };
  }

  // HLS - HTTP Live Streaming
  if (lowerUrl.includes('.m3u8') || lowerUrl.includes('application/x-mpegurl')) {
    return {
      container: 'm3u8',
      mimeType: 'application/x-mpegURL',
      isSupported: true,
      requiresNativePlayer: true,
      requiresWebView: false,
      requiresFFmpeg: false,
    };
  }

  // DASH - Dynamic Adaptive Streaming
  if (lowerUrl.includes('.mpd') || lowerUrl.includes('application/dash+xml')) {
    return {
      container: 'mpd',
      mimeType: 'application/dash+xml',
      isSupported: true,
      requiresNativePlayer: true,
      requiresWebView: false,
      requiresFFmpeg: false,
    };
  }

  // MOV - QuickTime
  if (lowerUrl.includes('.mov') || lowerUrl.includes('video/quicktime')) {
    return {
      container: 'mov',
      mimeType: 'video/quicktime',
      isSupported: true,
      requiresNativePlayer: true,
      requiresWebView: false,
      requiresFFmpeg: false,
    };
  }

  // MKV - Matroska (requires FFmpeg)
  if (lowerUrl.includes('.mkv') || lowerUrl.includes('video/x-matroska')) {
    return {
      container: 'mkv',
      mimeType: 'video/x-matroska',
      isSupported: true,
      requiresNativePlayer: false,
      requiresWebView: false,
      requiresFFmpeg: true,
    };
  }

  // AVI - Audio Video Interleave (requires FFmpeg)
  if (lowerUrl.includes('.avi') || lowerUrl.includes('video/x-msvideo')) {
    return {
      container: 'avi',
      mimeType: 'video/x-msvideo',
      isSupported: true,
      requiresNativePlayer: false,
      requiresWebView: false,
      requiresFFmpeg: true,
    };
  }

  // FLV - Flash Video (requires FFmpeg)
  if (lowerUrl.includes('.flv') || lowerUrl.includes('video/x-flv')) {
    return {
      container: 'flv',
      mimeType: 'video/x-flv',
      isSupported: true,
      requiresNativePlayer: false,
      requiresWebView: false,
      requiresFFmpeg: true,
    };
  }

  // Default to unknown
  return {
    container: 'unknown',
    isSupported: false,
    requiresNativePlayer: false,
    requiresWebView: false,
    requiresFFmpeg: false,
  };
}

/**
 * Check if device supports specific codec
 */
export function supportsCodec(codec: string): boolean {
  const supportedCodecs = [
    'h264',
    'avc1',
    'vp8',
    'vp9',
    'opus',
    'vorbis',
    'aac',
  ];

  return supportedCodecs.some(supported =>
    codec.toLowerCase().includes(supported)
  );
}

/**
 * Check if MP4 is likely to be HEVC/H.265
 */
export function isLikelyHEVC(url: string): boolean {
  const indicators = [
    'hevc',
    'h265',
    'hev1',
    'hvc1',
    '4k',
    'uhd',
    '2160p',
  ];

  const lowerUrl = url.toLowerCase();
  return indicators.some(indicator => lowerUrl.includes(indicator));
}

/**
 * Get recommended player for format
 */
export function getRecommendedPlayer(formatInfo: VideoFormatInfo): 'native' | 'webview' | 'ffmpeg' | 'unsupported' {
  if (!formatInfo.isSupported) {
    return 'unsupported';
  }

  if (formatInfo.requiresFFmpeg) {
    return 'ffmpeg';
  }

  if (formatInfo.requiresWebView) {
    return 'webview';
  }

  if (formatInfo.requiresNativePlayer) {
    return 'native';
  }

  return 'native';
}
