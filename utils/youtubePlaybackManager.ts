/**
 * YouTube Playback Manager
 * 
 * Purpose: Detect and manage YouTube playback modes (WebView vs Native)
 * 
 * Task 1: YouTube playback type detector
 */

export type YouTubePlaybackMode = 'webview' | 'native' | 'not-youtube';

export interface YouTubePlaybackInfo {
  mode: YouTubePlaybackMode;
  videoId: string | null;
  originalUrl: string;
  embedUrl: string | null;
  reason: string;
}

/**
 * Detects YouTube playback mode based on URL
 * 
 * @param url - The video URL to analyze
 * @returns YouTubePlaybackInfo with mode and details
 */
export function detectYoutubePlaybackMode(url: string): YouTubePlaybackInfo {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return {
      mode: 'not-youtube',
      videoId: null,
      originalUrl: url,
      embedUrl: null,
      reason: 'Empty or invalid URL'
    };
  }

  const trimmedUrl = url.trim().toLowerCase();
  
  // Check if it's a YouTube URL
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?.*[&?]v=|youtube\.com\/watch\?v=)([\w-]+)/i,
    /youtu\.be\/([\w-]+)(?:[?&][^\s]*)?/i,
    /youtube\.com\/embed\/([\w-]+)(?:[?&][^\s]*)?/i,
    /youtube\.com\/v\/([\w-]+)(?:[?&][^\s]*)?/i,
    /youtube\.com\/shorts\/([\w-]+)(?:[?&][^\s]*)?/i,
    /m\.youtube\.com\/watch\?.*[&?]v=([\w-]+)/i,
  ];

  let videoId: string | null = null;
  let matchedPattern: string | null = null;

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      videoId = match[1].split('&')[0].split('?')[0];
      matchedPattern = pattern.toString();
      break;
    }
  }

  if (!videoId) {
    return {
      mode: 'not-youtube',
      videoId: null,
      originalUrl: url,
      embedUrl: null,
      reason: 'Not a YouTube URL'
    };
  }

  // Detect if it's already an embed URL
  const isEmbedUrl = /youtube\.com\/embed\/[\w-]+/i.test(url);

  if (isEmbedUrl) {
    // Embed URLs should use native player module (YouTube iframe API)
    return {
      mode: 'native',
      videoId,
      originalUrl: url,
      embedUrl: url,
      reason: 'Embed URL detected - using native YouTube player module'
    };
  }

  // Standard watch URLs and short URLs should use WebView
  // This provides better user experience with full YouTube interface
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&controls=1&rel=0&modestbranding=1&playsinline=1`;
  
  return {
    mode: 'webview',
    videoId,
    originalUrl: url,
    embedUrl: embedUrl,
    reason: 'Standard YouTube URL - using WebView for full interface'
  };
}

/**
 * Creates a YouTube embed URL from video ID
 */
export function createYouTubeEmbedUrl(videoId: string, options?: {
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  mute?: boolean;
}): string {
  const params = new URLSearchParams({
    enablejsapi: '1',
    autoplay: options?.autoplay ? '1' : '0',
    controls: options?.controls !== false ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });

  if (options?.loop) {
    params.append('loop', '1');
    params.append('playlist', videoId);
  }

  if (options?.mute) {
    params.append('mute', '1');
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Extracts video ID from any YouTube URL format
 */
export function extractYouTubeVideoId(url: string): string | null {
  const info = detectYoutubePlaybackMode(url);
  return info.videoId;
}

/**
 * Checks if a URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  const info = detectYoutubePlaybackMode(url);
  return info.mode !== 'not-youtube';
}

/**
 * Gets playback recommendations for a YouTube URL
 */
export function getYouTubePlaybackRecommendation(url: string): {
  shouldUseWebView: boolean;
  shouldUseNative: boolean;
  reason: string;
} {
  const info = detectYoutubePlaybackMode(url);

  if (info.mode === 'not-youtube') {
    return {
      shouldUseWebView: false,
      shouldUseNative: false,
      reason: 'Not a YouTube URL'
    };
  }

  if (info.mode === 'native') {
    return {
      shouldUseWebView: false,
      shouldUseNative: true,
      reason: 'Embed URL should use native YouTube player for better API control'
    };
  }

  return {
    shouldUseWebView: true,
    shouldUseNative: false,
    reason: 'Standard YouTube URL should use WebView for full user experience'
  };
}
