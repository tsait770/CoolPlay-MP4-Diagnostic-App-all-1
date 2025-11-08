/**
 * Video Source Router
 * Routes video URLs to the appropriate player component
 * Preserves adult video playback functionality
 */

import { extractYouTubeVideoId } from '@/utils/videoUrlConverter';

export interface VideoSourceInfo {
  type: 'youtube' | 'mp4' | 'hls' | 'dash' | 'adult' | 'social' | 'cloud' | 'unknown';
  platform?: string;
  videoId?: string;
  usePlayer: 'youtube' | 'mp4' | 'webview' | 'social';
  requiresAuth?: boolean;
  requiresAgeVerification?: boolean;
}

export function routeVideoSource(url: string): VideoSourceInfo {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return {
      type: 'unknown',
      usePlayer: 'webview',
    };
  }

  const lowerUrl = url.toLowerCase();

  // YouTube - MUST use YouTube player
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    const { videoId } = extractYouTubeVideoId(url);
    console.log('[VideoSourceRouter] YouTube detected, videoId:', videoId);
    return {
      type: 'youtube',
      platform: 'YouTube',
      videoId: videoId || undefined,
      usePlayer: 'youtube',
    };
  }

  // Adult platforms - MUST preserve existing functionality
  const adultPlatforms = [
    { pattern: /pornhub\.com/i, name: 'Pornhub' },
    { pattern: /xvideos\.com/i, name: 'XVideos' },
    { pattern: /xnxx\.com/i, name: 'XNXX' },
    { pattern: /xhamster\.com/i, name: 'xHamster' },
    { pattern: /redtube\.com/i, name: 'RedTube' },
    { pattern: /youporn\.com/i, name: 'YouPorn' },
    { pattern: /tube8\.com/i, name: 'Tube8' },
    { pattern: /spankbang\.com/i, name: 'SpankBang' },
    { pattern: /eporner\.com/i, name: 'Eporner' },
    { pattern: /txxx\.com/i, name: 'TXXX' },
  ];

  for (const platform of adultPlatforms) {
    if (platform.pattern.test(url)) {
      console.log('[VideoSourceRouter] Adult platform detected:', platform.name);
      return {
        type: 'adult',
        platform: platform.name,
        usePlayer: 'webview',
        requiresAgeVerification: true,
      };
    }
  }

  // Social media platforms - preserve existing functionality  
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    return {
      type: 'social',
      platform: 'Twitter/X',
      usePlayer: 'social',
    };
  }

  if (lowerUrl.includes('instagram.com')) {
    return {
      type: 'social',
      platform: 'Instagram',
      usePlayer: 'social',
    };
  }

  if (lowerUrl.includes('tiktok.com')) {
    return {
      type: 'social',
      platform: 'TikTok',
      usePlayer: 'social',
    };
  }

  // Cloud storage - use WebView for now
  if (lowerUrl.includes('drive.google.com') || lowerUrl.includes('googledrive.com')) {
    return {
      type: 'cloud',
      platform: 'Google Drive',
      usePlayer: 'webview',
      requiresAuth: true,
    };
  }

  if (lowerUrl.includes('dropbox.com')) {
    return {
      type: 'cloud',
      platform: 'Dropbox',
      usePlayer: 'webview',
    };
  }

  // HLS streaming
  if (lowerUrl.includes('.m3u8') || lowerUrl.includes('application/x-mpegurl')) {
    console.log('[VideoSourceRouter] HLS detected');
    return {
      type: 'hls',
      usePlayer: 'mp4',
    };
  }

  // DASH streaming
  if (lowerUrl.includes('.mpd') || lowerUrl.includes('application/dash+xml')) {
    console.log('[VideoSourceRouter] DASH detected');
    return {
      type: 'dash',
      usePlayer: 'mp4',
    };
  }

  // Direct MP4
  if (lowerUrl.includes('.mp4') || lowerUrl.includes('video/mp4')) {
    console.log('[VideoSourceRouter] MP4 detected');
    return {
      type: 'mp4',
      usePlayer: 'mp4',
    };
  }

  // Other video formats that native player can handle
  if (lowerUrl.includes('.webm') || lowerUrl.includes('.mov') || lowerUrl.includes('.avi')) {
    console.log('[VideoSourceRouter] Other video format detected');
    return {
      type: 'mp4',
      usePlayer: 'mp4',
    };
  }

  // Default to WebView for unknown sources
  console.log('[VideoSourceRouter] Unknown source, using WebView');
  return {
    type: 'unknown',
    usePlayer: 'webview',
  };
}

export function extractYouTubeVideoIdFromUrl(url: string): string | null {
  const { videoId } = extractYouTubeVideoId(url);
  return videoId;
}

export function shouldUseYouTubePlayer(url: string): boolean {
  const info = routeVideoSource(url);
  return info.usePlayer === 'youtube';
}

export function shouldUseMP4Player(url: string): boolean {
  const info = routeVideoSource(url);
  return info.usePlayer === 'mp4';
}

export function shouldUseWebViewPlayer(url: string): boolean {
  const info = routeVideoSource(url);
  return info.usePlayer === 'webview';
}

export function shouldUseSocialPlayer(url: string): boolean {
  const info = routeVideoSource(url);
  return info.usePlayer === 'social';
}
