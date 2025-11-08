/**
 * Video URL Converter
 * Converts various video URLs to embeddable formats
 */

export interface YouTubeUrlParts {
  videoId: string | null;
  timestamp?: number;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(url: string): YouTubeUrlParts {
  if (!url || typeof url !== 'string') {
    return { videoId: null };
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      const timestampMatch = url.match(/[?&]t=(\d+)/);
      const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : undefined;
      return { videoId, timestamp };
    }
  }

  return { videoId: null };
}

/**
 * Convert YouTube URL to embed URL with optimal settings
 */
export function getYouTubeEmbedUrl(url: string, autoplay: boolean = false): string | null {
  const { videoId, timestamp } = extractYouTubeVideoId(url);
  
  if (!videoId) {
    console.error('[VideoUrlConverter] Invalid YouTube URL:', url);
    return null;
  }

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    fs: '1',
    controls: '1',
    enablejsapi: '1',
    origin: typeof window !== 'undefined' ? window.location.origin : 'https://rork.app',
    widget_referrer: 'https://rork.app',
  });

  if (timestamp) {
    params.append('start', timestamp.toString());
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Get alternative YouTube embed URLs for retry logic
 */
export function getYouTubeAlternatives(url: string, autoplay: boolean = false): string[] {
  const { videoId } = extractYouTubeVideoId(url);
  
  if (!videoId) {
    return [];
  }

  const baseParams = `autoplay=${autoplay ? '1' : '0'}&playsinline=1&rel=0&modestbranding=1&controls=1`;
  
  return [
    `https://www.youtube.com/embed/${videoId}?${baseParams}&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : 'https://rork.app'}`,
    `https://www.youtube-nocookie.com/embed/${videoId}?${baseParams}`,
    `https://www.youtube.com/embed/${videoId}?${baseParams}`,
    `https://m.youtube.com/watch?v=${videoId}&${baseParams}`,
    `https://yewtu.be/embed/${videoId}?${baseParams}`,
  ];
}

/**
 * Extract Vimeo video ID
 */
export function extractVimeoVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Convert Vimeo URL to embed URL
 */
export function getVimeoEmbedUrl(url: string, autoplay: boolean = false): string | null {
  const videoId = extractVimeoVideoId(url);
  
  if (!videoId) {
    console.error('[VideoUrlConverter] Invalid Vimeo URL:', url);
    return null;
  }

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    autopause: '0',
    player_id: '0',
    app_id: '58479',
  });

  return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
}

/**
 * Detect if URL needs conversion
 */
export function needsUrlConversion(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com')
  );
}

/**
 * Convert any supported video URL to embeddable format
 */
export function convertToEmbedUrl(url: string, autoplay: boolean = false): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return getYouTubeEmbedUrl(url, autoplay);
  }

  if (url.includes('vimeo.com')) {
    return getVimeoEmbedUrl(url, autoplay);
  }

  return url;
}
